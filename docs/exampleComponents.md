"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { removeSavedGym, saveGym } from "@/backendCalls/backendService";
import { WebAppIcon } from "@/components/WebAppIcon";
import { useAuthDialog } from "@/components/auth/AuthDialogProvider";
import { useAuthUser, useSavedGymIds } from "@/hooks/useFirestore";
import { queryKeys } from "@/lib/queryKeys";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebaseClients";
import { cn } from "@/lib/utils";
import type { GymCardProps, GymSchedule } from "@/types/backendTypes";
import { IconSizes } from "@/styles/iconSizes.tokens";

type GymCardVariant = "normal" | "compact" | "sheet" | "paywall";
type GymCardPerformanceMode = "single" | "list";
type DistanceUnit = "km" | "mi";

export type WebGymCardProps = GymCardProps & {
variant?: GymCardVariant;
performanceMode?: GymCardPerformanceMode;
isSaved?: boolean;
distanceUnit?: DistanceUnit;
startingPriceText?: string;
onToggleSaved?: (nextSaved: boolean, gymId?: string) => void;
className?: string;
};

const IMAGE_TRANSITION_MS = 300;

const DAY_KEYS = [
"sunday",
"monday",
"tuesday",
"wednesday",
"thursday",
"friday",
"saturday",
] as const;

function parseTimeToMinutes(value?: string | null) {
if (!value) return null;
const [h, m] = value.split(":").map(Number);
if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
return h \* 60 + m;
}

function resolveScheduleState(schedule: GymSchedule | null) {
if (!schedule) return { isOpen: false, textKey: "closed" as const };

const dayKey = DAY_KEYS[new Date().getDay()];
const currentDay = schedule[dayKey];
if (!currentDay || !currentDay.isOpen)
return { isOpen: false, textKey: "closed" as const };

const opening = parseTimeToMinutes(currentDay.openingTime);
const closing = parseTimeToMinutes(currentDay.closingTime);
if (opening === null || closing === null)
return { isOpen: false, textKey: "closed" as const };

const now = new Date().getHours() \* 60 + new Date().getMinutes();
const isOpen =
closing >= opening
? now >= opening && now < closing
: now >= opening || now < closing;

return { isOpen, textKey: isOpen ? ("open" as const) : ("closed" as const) };
}

function formatPriceWithSymbol(
userPrice: number,
currencyCode?: string | null,
) {
const safeCurrencyCode = currencyCode || "USD";
try {
return new Intl.NumberFormat(undefined, {
style: "currency",
currency: safeCurrencyCode,
maximumFractionDigits: userPrice % 1 === 0 ? 0 : 2,
}).format(userPrice);
} catch {
return `${userPrice} ${safeCurrencyCode}`;
}
}

const convertDistance = (
km: number,
distanceUnit: DistanceUnit,
roundValue = false,
) => {
if (roundValue) {
if (distanceUnit === "km") return Math.round(km);
return Math.round(km \* 0.621371);
}

if (distanceUnit === "km") {
const roundedKm = Math.round(km \* 10) / 10;
return Number(roundedKm.toFixed(1).replace(/\.0$/, ""));
}

const miles = km _ 0.621371;
const roundedMiles = Math.round(miles _ 10) / 10;
return Number(roundedMiles.toFixed(1).replace(/\.0$/, ""));
};

export const WebGymCardList: React.FC<WebGymCardProps> = ({
gymName,
rating,
mainImage,
schedule,
city,
gymId,
startingPrice,
onPress,
isRecommended,
distanceKm,
isLoading = false,
variant = "normal",
performanceMode = "single",
isSaved,
distanceUnit = "km",
startingPriceText,
onToggleSaved,
className,
}) => {
const { t } = useTranslation();
const pathname = usePathname();
const queryClient = useQueryClient();
const { openAuthDialog } = useAuthDialog();
const { user } = useAuthUser();
const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
const [saveInProgress, setSaveInProgress] = useState(false);
const shouldUseInternalSavedState = !onToggleSaved;
const { data: savedGymIds = [] } = useSavedGymIds(
user?.uid ?? null,
shouldUseInternalSavedState,
);
const scheduleInfo = useMemo(
() => resolveScheduleState(schedule),
[schedule],
);
const resolvedIsSaved = useMemo(() => {
if (typeof isSaved === "boolean") return isSaved;
if (!gymId) return false;
return savedGymIds.includes(gymId);
}, [gymId, isSaved, savedGymIds]);
const distanceLabel = useMemo(() => {
if (!distanceKm) return "";
const convertedDistance = convertDistance(distanceKm, distanceUnit);
const unitLabel = t(`distanceUnit.${distanceUnit}`, {
defaultValue: distanceUnit,
});
return t("distanceUnit.away", {
distance: convertedDistance,
unit: unitLabel,
defaultValue: `${convertedDistance} ${unitLabel} away`,
});
}, [distanceKm, distanceUnit, t]);
const resolvedStartingPriceText = useMemo(() => {
if (typeof startingPriceText === "string") return startingPriceText;
if (!startingPrice) return "";
return formatPriceWithSymbol(
startingPrice.userPrice ?? 0,
startingPrice.currencyCode,
);
}, [startingPrice, startingPriceText]);
const isSheet = variant === "sheet";
const heartIconSize = useMemo(() => {
if (isSheet) return 32;
if (variant === "compact") return IconSizes["5xl"];
return 26;
}, [isSheet, variant]);

const handleLikePress = async (
event: React.MouseEvent<HTMLButtonElement>,
) => {
event.preventDefault();
event.stopPropagation();

    if (!gymId || saveInProgress) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      openAuthDialog({ nextPath: pathname || "/" });
      return;
    }
    const userId = currentUser.uid;

    const nextLiked = !resolvedIsSaved;

    if (onToggleSaved) {
      onToggleSaved(nextLiked, gymId);
      return;
    }

    queryClient.setQueryData<string[]>(
      queryKeys.savedGymIds(userId),
      (current = []) =>
        nextLiked
          ? [...new Set([...current, gymId])]
          : current.filter((item) => item !== gymId),
    );

    try {
      setSaveInProgress(true);
      if (nextLiked) {
        await saveGym(gymId);
      } else {
        await removeSavedGym(gymId);
      }
    } catch (error) {
      queryClient.setQueryData<string[]>(
        queryKeys.savedGymIds(userId),
        (current = []) =>
          nextLiked
            ? current.filter((item) => item !== gymId)
            : [...new Set([...current, gymId])],
      );
      toast.error(
        t("toast.savedGyms.updateError.label", {
          defaultValue: "Couldn't update saved gyms.",
        }),
      );
      console.error("[web-gym-card] Failed toggling saved gym", error);
    } finally {
      setSaveInProgress(false);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.savedGymIds(userId),
      });
    }

};
const isMainImageLoaded =
typeof mainImage === "string" &&
mainImage.length > 0 &&
loadedImageSrc === mainImage;

return (

<article
className={cn(
"w-full",
isSheet
? "max-w-full"
: variant === "compact"
? "max-w-[10.5rem]"
: "max-w-60",
className,
)} >
<div
role="button"
tabIndex={0}
onClick={() => onPress?.()}
onKeyDown={(event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
onPress?.();
}
}}
className="w-full cursor-pointer text-left outline-none"
data-testid={gymId ? `gymCard.${gymId}` : undefined} >
<div className={cn("space-y-2")}>
<div
className={cn(
"relative h-auto aspect-[1.25/1] overflow-hidden rounded-2xl",
)} >
{isLoading ? (
<Skeleton className="h-full w-full rounded-none" />
) : mainImage ? (
// eslint-disable-next-line @next/next/no-img-element
<img
src={mainImage}
alt={gymName}
className={cn(
"h-full w-full object-cover transition-opacity ease-out",
isMainImageLoaded ? "opacity-100" : "opacity-0",
)}
loading="lazy"
onLoad={() => {
setLoadedImageSrc(mainImage);
}}
onError={() => {
setLoadedImageSrc(mainImage);
}}
style={{ transitionDuration: `${IMAGE_TRANSITION_MS}ms` }}
/>
) : (
<div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,oklch(0.6426_0.2509_11_/_0.16),transparent_55%),radial-gradient(circle_at_80%_80%,oklch(0.6426_0.2509_11_/_0.12),transparent_55%)]" />
)}

            {schedule && !isLoading && (
              <div
                className={cn(
                  "bg-overlay/80 absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md py-1",
                  isSheet ? "px-2" : "px-1.5",
                )}
              >
                <WebAppIcon
                  family="MaterialCommunityIcons"
                  name={
                    scheduleInfo.isOpen
                      ? "clock-star-four-points"
                      : "clock-star-four-points-outline"
                  }
                  size={isSheet ? "lg" : "sm"}
                  className="shrink-0 text-foreground transition-transform"
                />
                <span
                  className={cn(
                    "text-foreground font-medium",
                    isSheet ? "text-md" : "text-sm",
                  )}
                >
                  {t(`landing.webGymCard.schedule.${scheduleInfo.textKey}`)}
                </span>
              </div>
            )}

            {!isLoading && (
              <div
                className={cn(
                  "bg-overlay/80 absolute right-2 top-2 inline-flex items-center justify-end gap-1 rounded-md py-0.5 text-xs font-medium text-foreground",
                  isSheet ? "px-2" : "px-1.5",
                )}
              >
                <WebAppIcon
                  family="Ionicons"
                  name="star"
                  size="sm"
                  className={cn("text-foreground transition-transform")}
                />
                <span className={cn("font-medium", "text-md")}>
                  {rating?.calculatedAverage || 0}
                </span>
              </div>
            )}

            {gymId && !isLoading && (
              <button
                type="button"
                onClick={handleLikePress}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                }}
                className="group absolute cursor-pointer right-2 bottom-2 z-1 inline-flex min-h-9 min-w-9 items-center justify-center p-0.5 text-foreground transition-transform duration-150 hover:scale-110"
                aria-label={
                  resolvedIsSaved
                    ? t("landing.webGymCard.actions.removeSavedGym")
                    : t("landing.webGymCard.actions.saveGym")
                }
                aria-pressed={resolvedIsSaved}
              >
                <span className="relative inline-flex items-center justify-center">
                  <WebAppIcon
                    family="MaterialCommunityIcons"
                    name="heart"
                    size={heartIconSize}
                    className="absolute text-foreground/15"
                  />
                  <WebAppIcon
                    family="MaterialCommunityIcons"
                    name={resolvedIsSaved ? "heart" : "heart-outline"}
                    size={heartIconSize}
                    className={cn(
                      resolvedIsSaved
                        ? "text-primary"
                        : "text-white group-hover:text-primary",
                    )}
                  />
                </span>
              </button>
            )}
          </div>

          {variant !== "paywall" && (
            <div className="flex-col justify-center pl-px">
              <div className="flex flex-row items-center justify-between">
                <div className="flex-1 flex-col items-start justify-center">
                  {isLoading ? (
                    <Skeleton className="mb-1 h-4 w-2/3 rounded-sm" />
                  ) : !isRecommended ? (
                    <p
                      className={cn(
                        "line-clamp-1 font-semibold text-foreground",
                        isSheet
                          ? "text-lg"
                          : variant === "compact"
                            ? "text-sm"
                            : "text-md",
                      )}
                    >
                      {gymName}
                    </p>
                  ) : (
                    <div className="flex flex-row items-center gap-1">
                      <p
                        className={cn(
                          "text-primary line-clamp-1 font-semibold",
                          isSheet
                            ? "text-lg"
                            : variant === "compact"
                              ? "text-sm"
                              : "text-md",
                        )}
                      >
                        {gymName}
                      </p>
                      <WebAppIcon
                        family="MaterialCommunityIcons"
                        name="crown-outline"
                        className="shrink-0 text-primary"
                        size={variant === "compact" ? "xl" : "2xl"}
                      />
                    </div>
                  )}
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="mb-1 h-4 w-2/4 rounded-sm" />
              ) : (
                city && (
                  <p
                    className={cn(
                      "text-muted-foreground line-clamp-1",
                      isSheet ? "text-md" : "text-sm",
                    )}
                  >
                    {city.name}, {city.country}
                    {distanceKm ? ` • ${distanceLabel}` : ""}
                  </p>
                )
              )}

              {isLoading ? (
                <Skeleton className="h-4 w-2/5 rounded-sm" />
              ) : (
                startingPrice && (
                  <p
                    className={cn(
                      "text-muted-foreground line-clamp-1",
                      isSheet ? "text-md" : "text-sm",
                    )}
                  >
                    {t("landing.webGymCard.startsFrom", {
                      price: resolvedStartingPriceText,
                    })}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </article>

);
};

WebGymCardList.displayName = "WebGymCardList";

const WebGymCardSingle: React.FC<WebGymCardProps> = (props) => {
return <WebGymCardList {...props} />;
};

export default React.memo(WebGymCardSingle);

##### HEADER

"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useAuthDialog } from "@/components/auth/AuthDialogProvider";
import {
WebAppIcon,
type WebAppIconFamily,
type WebAppIconName,
} from "@/components/WebAppIcon";
import { GymDetailsHeaderActions } from "@/components/app/gym-details/GymDetailsHeaderActions";
import { useGymDetailsHeaderMerge } from "@/components/app/gym-details/useGymDetailsHeaderMerge";
import {
useAuthUser,
useGymPublicDetails,
useUserData,
} from "@/hooks/useFirestore";
import { auth } from "@/lib/firebaseClients";
import { clearServerSession } from "@/lib/sessionClient";
import { cn } from "@/lib/utils";
import { IconSizes } from "@/styles/iconSizes.tokens";
import ThemeToggleClient from "./theme-toggle-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
Popover,
PopoverContent,
PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { FEED_HEADER_CONTROLS_SLOT_ID } from "@/components/app/feed/FeedHeaderControlsPortal";

const loginOutlinedIcon = "login" as const;
const logoutOutlinedIcon = "logout" as const;
const personAddAlt1OutlinedIcon = "person-add-alt-1" as const;
const accountCircleOutlinedIcon = "account-circle" as const;
const searchOutlinedIcon = "search" as const;
const favoriteBorderOutlinedIcon = "favorite-border" as const;
const chatBubbleOutlineOutlinedIcon = "chat-bubble-outline" as const;
const insightsOutlinedIcon = "insights" as const;
const chevronLeftIcon = "chevron-left" as const;
const menuOutlineIcon = "menu-outline" as const;
const closeIcon = "close" as const;
const mdiDumbbell = "dumbbell" as const;
const mdiKarate = "karate" as const;
const mdiMapMarkerStar = "map-marker-star" as const;
const mdiSearchWeb = "search-web" as const;
const mdiShareVariantOutline = "share-variant-outline" as const;
const mdiSoccer = "soccer" as const;
const mdiSpaOutline = "spa-outline" as const;
const mdiYoga = "yoga" as const;

type HeaderVariant = "app" | "marketing";
type HeaderIconSpec<F extends WebAppIconFamily = WebAppIconFamily> = {
family: F;
name: WebAppIconName<F>;
};

type AppNavItem = {
name: string;
href: string;
icon: HeaderIconSpec<"MaterialIcons">;
};

type MobileMenuItem = {
href: string;
name: string;
icon: HeaderIconSpec<"MaterialIcons"> | null;
scope: "app" | "marketing";
};

type FeedHeaderTab = "explore" | "nearby";
type GymDetailsSectionKey = "reviews" | "amenities" | "location";

const marketingPrefixes = ["/about", "/pricing", "/contact", "/legal"] as const;
const authPrefixes = ["/sign-up"] as const;
const topLevelAppRoutes = [
"/",
"/roam",
"/favourites",
"/messages",
"/admin",
] as const;
const mobileHeaderlessAppPrefixes = [
"/favourites",
"/messages",
"/admin",
"/profile",
] as const;
const FEED_NEARBY_HASH = "#nearby";
const GYM_DETAILS_SECTION_IDS: Record<GymDetailsSectionKey, string> = {
reviews: "gym-details-reviews",
amenities: "gym-details-amenities",
location: "gym-details-location",
};
const GYM_CATEGORY_ICON_PATHS = {
strength: mdiDumbbell,
wellness: mdiSpaOutline,
combat: mdiKarate,
sports: mdiSoccer,
movement: mdiYoga,
performance: mdiShareVariantOutline,
} as const;

const resolveScheduleState = (
schedule: import("@/types/backendTypes").GymSchedule | null | undefined,
) => {
if (!schedule) return { textKey: "closed" as const };

const dayMap = [
"sunday",
"monday",
"tuesday",
"wednesday",
"thursday",
"friday",
"saturday",
] as const;
const currentDay = schedule[dayMap[new Date().getDay()]];
if (!currentDay?.isOpen) return { textKey: "closed" as const };

const parseTime = (value?: string) => {
if (!value) return null;
const [hours, minutes] = value.split(":").map(Number);
if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
return hours \* 60 + minutes;
};

const opening = parseTime(currentDay.openingTime);
const closing = parseTime(currentDay.closingTime);
if (opening === null || closing === null)
return { textKey: "closed" as const };

const now = new Date().getHours() \* 60 + new Date().getMinutes();
const isOpen =
closing >= opening
? now >= opening && now < closing
: now >= opening || now < closing;

return { textKey: isOpen ? ("open" as const) : ("closed" as const) };
};

const resolveFeedTabFromHash = (hashValue: string): FeedHeaderTab =>
hashValue.toLowerCase() === FEED_NEARBY_HASH ? "nearby" : "explore";

const isPathInScope = (pathname: string, href: string) =>
pathname === href || pathname.startsWith(`${href}/`);

const isHashNavItem = (href: string) => href.includes("#");

const getHeaderVariant = (pathname: string): HeaderVariant => {
const isMarketing =
marketingPrefixes.some((prefix) => isPathInScope(pathname, prefix)) ||
authPrefixes.some((prefix) => isPathInScope(pathname, prefix));

return isMarketing ? "marketing" : "app";
};

const isAppNavItemActive = (pathname: string, href: string) => {
if (href === "/") {
return pathname === "/" || pathname.startsWith("/gyms/");
}

return isPathInScope(pathname, href);
};

const normalizePathname = (pathname: string) => {
if (pathname === "/") return pathname;
return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export const Header = () => {
const { t } = useTranslation();
const router = useRouter();
const routeParams = useParams<{
gymId?: string | string[];
gymSlug?: string | string[];
}>();
const { openAuthDialog } = useAuthDialog();
const pathname = usePathname();
const { user, isLoading: isAuthLoading } = useAuthUser();
const { data: userData } = useUserData(user?.uid ?? null);
const headerVariant = React.useMemo(
() => getHeaderVariant(pathname ?? "/"),
[pathname],
);
const normalizedPathname = React.useMemo(
() => normalizePathname(pathname ?? "/"),
[pathname],
);
const gymRouteId = React.useMemo(() => {
const rawGymId = routeParams?.gymId;
if (Array.isArray(rawGymId)) return rawGymId[0] ?? "";
return rawGymId?.trim() ?? "";
}, [routeParams?.gymId]);
const gymRouteSlug = React.useMemo(() => {
const rawGymSlug = routeParams?.gymSlug;
if (Array.isArray(rawGymSlug)) return rawGymSlug[0] ?? "";
return rawGymSlug?.trim() ?? "";
}, [routeParams?.gymSlug]);
const isGymDetailsRoute = React.useMemo(
() =>
normalizedPathname.startsWith("/gyms/") &&
!normalizedPathname.endsWith("/location"),
[normalizedPathname],
);
const { data: gymHeaderDetails } = useGymPublicDetails(
isGymDetailsRoute && gymRouteId ? gymRouteId : null,
);
const gymHeaderTitle = React.useMemo(() => {
if (gymHeaderDetails?.gymName) return gymHeaderDetails.gymName;
if (!gymRouteSlug) return t("misc.loading");

    return gymRouteSlug
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

}, [gymHeaderDetails?.gymName, gymRouteSlug, t]);
const gymHeaderCategoryLabel = React.useMemo(() => {
if (!gymHeaderDetails?.gymCategory) return "";
return t(`gymCategories.${gymHeaderDetails.gymCategory}`);
}, [gymHeaderDetails?.gymCategory, t]);
const isMarketingContentRoute = React.useMemo(
() =>
marketingPrefixes.some((prefix) =>
isPathInScope(normalizedPathname, prefix),
),
[normalizedPathname],
);
const isAuthContentRoute = React.useMemo(
() =>
authPrefixes.some((prefix) => isPathInScope(normalizedPathname, prefix)),
[normalizedPathname],
);
const isTopLevelAppRoute = React.useMemo(
() =>
headerVariant === "app" &&
topLevelAppRoutes.some((route) => route === normalizedPathname),
[headerVariant, normalizedPathname],
);
const shouldHideHeaderOnMobile = React.useMemo(() => {
if (isAuthContentRoute) return true;
if (headerVariant !== "app") return false;
return mobileHeaderlessAppPrefixes.some((prefix) =>
isPathInScope(normalizedPathname, prefix),
);
}, [headerVariant, isAuthContentRoute, normalizedPathname]);
const shouldHideMobileBottomNav = React.useMemo(
() =>
headerVariant === "app" &&
/^\/messages\/(?:user|gym)\/[^/]+\/.+$/.test(normalizedPathname),
    [headerVariant, normalizedPathname],
  );
  const shouldUseInFlowMobileBottomNav = React.useMemo(
    () =>
      headerVariant === "app" &&
      (normalizedPathname === "/messages" ||
        /^\/messages\/(?:user|gym)\/[^/]+$/.test(normalizedPathname)),
[headerVariant, normalizedPathname],
);
const shouldKeepDesktopAppNavExpanded = React.useMemo(
() =>
headerVariant === "app" &&
/^\/messages\/(?:user|gym)\/[^/]+\/.+$/.test(normalizedPathname),
[headerVariant, normalizedPathname],
);
const shouldUseInFlowDesktopHeader = React.useMemo(
() => headerVariant === "app" && normalizedPathname.startsWith("/messages"),
[headerVariant, normalizedPathname],
);
const shouldShowFeedTabsOnlyMobile = React.useMemo(
() => headerVariant === "app" && normalizedPathname === "/",
[headerVariant, normalizedPathname],
);
const [menuState, setMenuState] = React.useState(false);
const [scrollY, setScrollY] = React.useState(0);
const lastScrollYRef = React.useRef(0);
const [isMobileBottomNavHidden, setIsMobileBottomNavHidden] =
React.useState(false);
const mobileMenuContentRef = React.useRef<HTMLDivElement | null>(null);
const [mobileMenuContentHeight, setMobileMenuContentHeight] =
React.useState(0);
const feedTabsContentRef = React.useRef<HTMLDivElement | null>(null);
const [feedTabsContentHeight, setFeedTabsContentHeight] = React.useState(0);
const [isLoggingOut, setIsLoggingOut] = React.useState(false);
const scrolled = scrollY > 1;
const collapseAppCenter =
headerVariant === "app" &&
!isTopLevelAppRoute &&
!shouldKeepDesktopAppNavExpanded;
const showTopLevelAppNav =
isTopLevelAppRoute ||
isMarketingContentRoute ||
isAuthContentRoute ||
shouldKeepDesktopAppNavExpanded;
const navSlideOffset = collapseAppCenter ? -6 : 0;
const navItemsOpacity = showTopLevelAppNav && !collapseAppCenter ? 1 : 0;
const showFeedHeaderTabs =
headerVariant === "app" && normalizedPathname === "/";
const showGymDetailsHeader = headerVariant === "app" && isGymDetailsRoute;
const { isMobileViewport: isGymHeaderMobileViewport, mergeProgress } =
useGymDetailsHeaderMerge(showGymDetailsHeader);
const showDesktopGymStaticHeader =
showGymDetailsHeader && !isGymHeaderMobileViewport;
const [feedHeaderTab, setFeedHeaderTab] =
React.useState<FeedHeaderTab>("explore");
const marketingNavItems = React.useMemo(
() => [
{
name: t("header.marketingNav.about"),
href: "/about",
},
{ name: t("header.marketingNav.contact"), href: "/contact" },
{ name: t("header.marketingNav.pricing"), href: "/pricing" },
],
[t],
);
const appNavItems = React.useMemo<AppNavItem[]>(
() => [
{
name: t("header.appNav.feed"),
href: "/",
icon: { family: "MaterialIcons", name: searchOutlinedIcon },
},
{
name: t("header.appNav.favourites"),
href: "/favourites",
icon: {
family: "MaterialIcons",
name: favoriteBorderOutlinedIcon,
},
},
{
name: t("header.appNav.messages"),
href: "/messages",
icon: {
family: "MaterialIcons",
name: chatBubbleOutlineOutlinedIcon,
},
},
{
name: t("header.appNav.admin"),
href: "/admin",
icon: { family: "MaterialIcons", name: insightsOutlinedIcon },
},
],
[t],
);
const mobileBottomNavItems = React.useMemo<AppNavItem[]>(
() => [
...appNavItems,
{
name: t("header.appNav.profile"),
href: "/profile",
icon: {
family: "MaterialIcons",
name: accountCircleOutlinedIcon,
},
},
],
[appNavItems, t],
);

React.useEffect(() => {
if (shouldUseInFlowMobileBottomNav) {
lastScrollYRef.current = 0;
setScrollY(0);
setIsMobileBottomNavHidden(false);
return;
}

    let rafId = 0;

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        const nextScrollY = window.scrollY;
        const delta = nextScrollY - lastScrollYRef.current;

        if (nextScrollY <= 12) {
          setIsMobileBottomNavHidden(false);
        } else if (delta > 4) {
          setIsMobileBottomNavHidden(true);
        } else if (delta < -4) {
          setIsMobileBottomNavHidden(false);
        }

        lastScrollYRef.current = nextScrollY;
        setScrollY(nextScrollY);
        rafId = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };

}, [shouldUseInFlowMobileBottomNav]);

React.useEffect(() => {
if (shouldUseInFlowMobileBottomNav) {
lastScrollYRef.current = 0;
setScrollY(0);
setIsMobileBottomNavHidden(false);
return;
}

    const nextScrollY = window.scrollY;
    lastScrollYRef.current = nextScrollY;
    setScrollY(nextScrollY);
    setIsMobileBottomNavHidden(false);

}, [pathname, shouldUseInFlowMobileBottomNav]);

React.useEffect(() => {
setMenuState(false);
}, [pathname]);

React.useEffect(() => {
if (!showFeedHeaderTabs || typeof window === "undefined") return;

    const syncFeedTabFromLocation = () => {
      setFeedHeaderTab(resolveFeedTabFromHash(window.location.hash));
    };

    syncFeedTabFromLocation();
    window.addEventListener("hashchange", syncFeedTabFromLocation);
    window.addEventListener("popstate", syncFeedTabFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncFeedTabFromLocation);
      window.removeEventListener("popstate", syncFeedTabFromLocation);
    };

}, [showFeedHeaderTabs]);

const handleFeedHeaderTabChange = React.useCallback((value: string) => {
const nextTab = value === "nearby" ? "nearby" : "explore";
setFeedHeaderTab(nextTab);

    if (typeof window !== "undefined") {
      const hash = nextTab === "nearby" ? FEED_NEARBY_HASH : "";
      const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    }

}, []);

const feedTabTriggerClass = React.useCallback(
(isActive: boolean) =>
cn(
"w-full rounded-none px-1 py-2 text-lg font-medium text-muted-foreground hover:text-primary",
isActive && "text-primary font-semibold",
),
[],
);

const handleLoginClick = React.useCallback(() => {
openAuthDialog();
}, [openAuthDialog]);

const handleRegisterClick = React.useCallback(() => {
router.push("/sign-up");
}, [router]);

const handleLogoutClick = React.useCallback(async () => {
try {
setIsLoggingOut(true);
const [sessionResult, signOutResult] = await Promise.allSettled([
clearServerSession(),
signOut(auth),
]);

      if (sessionResult.status === "rejected") {
        console.warn(
          "[auth] Failed clearing server session cookie",
          sessionResult.reason,
        );
      }

      if (signOutResult.status === "rejected") {
        throw signOutResult.reason;
      }

      setMenuState(false);
    } catch (error) {
      console.error("[auth] Logout failed", error);
    } finally {
      setIsLoggingOut(false);
    }

}, []);

const scrollToGymDetailsSection = React.useCallback(
(section: GymDetailsSectionKey) => {
if (typeof document === "undefined") return;
const target = document.getElementById(GYM_DETAILS_SECTION_IDS[section]);
if (!target) return;
target.scrollIntoView({ behavior: "smooth", block: "start" });
},
[],
);

const userDisplayName = React.useMemo(() => {
const displayName = user?.displayName?.trim();
if (displayName) return displayName;

    const emailName = user?.email?.split("@")[0]?.trim();
    if (emailName) return emailName;

    return t("header.user.fallbackName");

}, [t, user]);

const userInitial = React.useMemo(
() => userDisplayName.charAt(0).toUpperCase(),
[userDisplayName],
);

const roleLabel = React.useMemo(() => {
if (!userData) return null;

    // Priority: Gym owner > Staff member > GymHunter user
    if (userData.ownedGym || userData.ownedGymObject?.id) {
      return t("header.user.roles.gymOwner");
    }

    const staffCount =
      (userData.staffOfGyms?.length ?? 0) +
      Object.keys(userData.staffOfGymsObject ?? {}).length;

    if (staffCount > 0) {
      return t("header.user.roles.staffMember");
    }

    return t("header.user.roles.gymHunterUser");

}, [t, userData]);

const mobileMenuItems = React.useMemo<MobileMenuItem[]>(() => {
const marketingItems: MobileMenuItem[] = marketingNavItems.map((item) => ({
href: item.href,
name: item.name,
icon: null,
scope: "marketing",
}));

    if (headerVariant === "marketing") {
      return marketingItems;
    }

    return marketingItems;

}, [headerVariant, marketingNavItems]);

React.useEffect(() => {
const node = mobileMenuContentRef.current;
if (!node) return;

    const measure = () => {
      setMobileMenuContentHeight(node.scrollHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(node);

    return () => observer.disconnect();

}, [mobileMenuItems, pathname, user, userData, isAuthLoading]);

React.useEffect(() => {
const node = feedTabsContentRef.current;
if (!node) return;

    const measure = () => {
      setFeedTabsContentHeight(node.scrollHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(node);

    return () => observer.disconnect();

}, [showFeedHeaderTabs]);

return (
<header
className={cn(
shouldUseInFlowMobileBottomNav && "order-2 shrink-0 lg:order-none",
)} >
{showDesktopGymStaticHeader ? (
<nav className="w-full border-b border-border/45 bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
<div className="w-full px-4 pt-4 pb-4 sm:px-8 md:px-12 xl:px-16">
<div className="relative mx-auto w-full max-w-[1760px]">
<div className="relative flex items-center justify-between">
<div className="flex items-center min-[1200px]:gap-4 min-[1600px]:gap-8 min-[2100px]:gap-12">
<Link
href="/"
aria-label={t("header.brandHomeAriaLabel")}
className={cn(
"flex items-center space-x-2 min-[1200px]:mr-2 min-[1600px]:mr-8 min-[2100px]:mr-16",
)} >
<Image
src="/assets/logoFull.png"
alt={t("header.brandAlt")}
width={160}
height={40}
className="hidden h-8 w-auto min-[500px]:block"
/>
<Image
src="/assets/logo.png"
alt={t("header.brandAlt")}
width={32}
height={32}
className="size-8 min-[500px]:hidden"
/>
</Link>
</div>

                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center lg:flex">
                  <ul className="pointer-events-auto flex items-center gap-8">
                    {appNavItems.map((item) => {
                      const active = isAppNavItemActive(
                        normalizedPathname,
                        item.href,
                      );

                      return (
                        <li key={`desktop-gym-static-app-nav-${item.href}`}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            aria-label={item.name}
                            title={item.name}
                            className={cn(
                              buttonVariants({
                                variant: "ghost",
                                size: "icon-lg",
                              }),
                              "size-12 rounded-2xl border border-transparent transition-all duration-150 active:scale-95",
                              active
                                ? "text-primary hover:bg-transparent hover:text-primary"
                                : "text-muted-foreground hover:bg-transparent hover:text-primary",
                            )}
                          >
                            <WebAppIcon
                              family={item.icon.family}
                              name={item.icon.name}
                              size={26}
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="hidden items-center gap-4 lg:flex">
                  <div className="hidden min-[1200px]:block">
                    <ThemeToggleClient triggerClassName="size-9 [&_svg]:scale-110" />
                  </div>

                  {user ? (
                    <div className="flex items-center gap-3">
                      <Popover>
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="inline-flex h-9 items-center gap-2.5 rounded-lg px-2 text-right transition-colors hover:bg-muted/60 focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none aria-expanded:bg-muted/60"
                              aria-label={t("header.user.openAccountMenu")}
                            >
                              <div className="flex min-w-0 flex-col justify-center leading-tight">
                                <p className="truncate leading-tight text-md font-semibold text-foreground">
                                  {userDisplayName}
                                </p>
                                <p className="truncate text-sm leading-tight text-muted-foreground">
                                  {roleLabel ??
                                    t("header.user.roles.gymHunterUser")}
                                </p>
                              </div>

                              <Avatar size="default" className="size-8">
                                <AvatarImage
                                  src={user.photoURL ?? undefined}
                                  alt={userDisplayName}
                                />
                                <AvatarFallback>{userInitial}</AvatarFallback>
                              </Avatar>
                            </button>
                          }
                        />
                        <PopoverContent align="end" className="w-56">
                          <Button
                            variant="ghost"
                            className="h-8 w-full justify-start"
                            onClick={() => {
                              setMenuState(false);
                              router.push("/profile");
                            }}
                          >
                            {t("header.user.editProfile")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => void handleLogoutClick()}
                            disabled={isLoggingOut}
                          >
                            <WebAppIcon
                              family="MaterialIcons"
                              name={logoutOutlinedIcon}
                              size={IconSizes.xl}
                            />
                            {t("header.user.logOut")}
                          </Button>
                        </PopoverContent>
                      </Popover>

                      {isLoggingOut && <Spinner className="size-4" />}
                    </div>
                  ) : (
                    !isAuthLoading && (
                      <>
                        <Button compact onClick={handleLoginClick}>
                          <WebAppIcon
                            family="MaterialIcons"
                            name={loginOutlinedIcon}
                            size={IconSizes.xl}
                          />
                          <span className="text-md font-medium">
                            {t("header.auth.logIn")}
                          </span>
                        </Button>
                        <Button
                          compact
                          variant="secondary"
                          onClick={handleRegisterClick}
                        >
                          <WebAppIcon
                            family="MaterialIcons"
                            name={personAddAlt1OutlinedIcon}
                            size={IconSizes.xl}
                          />
                          <span className="text-md font-medium">
                            {t("header.auth.register")}
                          </span>
                        </Button>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      ) : null}
      <nav
        data-gym-details-header={showGymDetailsHeader ? "true" : undefined}
        data-gym-details-merge-header={
          showGymDetailsHeader ? "true" : undefined
        }
        data-state={menuState && "active"}
        className={cn(
          "fixed top-0 left-0 z-20 w-full border-b border-border/45 bg-background/80 backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-background/60",
          shouldUseInFlowDesktopHeader &&
            "lg:static lg:top-auto lg:left-auto lg:z-auto",
          shouldHideHeaderOnMobile && "hidden lg:block",
          showDesktopGymStaticHeader && "hidden md:block",
          shouldShowFeedTabsOnlyMobile &&
            "border-b-transparent bg-background shadow-none backdrop-blur-none supports-[backdrop-filter]:bg-background lg:border-b lg:border-border/45 lg:bg-background/80 lg:backdrop-blur-2xl lg:supports-[backdrop-filter]:bg-background/60",
          scrolled &&
            !showGymDetailsHeader &&
            !shouldShowFeedTabsOnlyMobile &&
            "bg-background/50 supports-[backdrop-filter]:bg-background/80 shadow-sm",
          showGymDetailsHeader &&
            isGymHeaderMobileViewport &&
            "border-b-transparent bg-transparent shadow-none backdrop-blur-none supports-[backdrop-filter]:bg-transparent",
        )}
        style={
          showDesktopGymStaticHeader
            ? {
                opacity: mergeProgress,
                pointerEvents: mergeProgress > 0 ? "auto" : "none",
              }
            : undefined
        }
      >
        {showGymDetailsHeader && isGymHeaderMobileViewport ? (
          <div
            className="pointer-events-none absolute inset-0 border-b border-border/45 bg-background/95 backdrop-blur-2xl transition-opacity duration-200"
            style={{ opacity: mergeProgress }}
          />
        ) : null}
        <div
          className={cn(
            "w-full px-4 pt-4 transition-all duration-300 sm:px-8 md:px-12 xl:px-16",
            shouldShowFeedTabsOnlyMobile && "px-0 pt-4 lg:px-4 lg:pt-4",
            showFeedHeaderTabs ? "pb-0" : "pb-4",
          )}
        >
          <div className="relative mx-auto w-full max-w-[1760px]">
            <div
              className={cn(
                "relative flex items-center justify-between",
                showFeedHeaderTabs && "lg:mb-4",
                shouldShowFeedTabsOnlyMobile && "hidden lg:flex",
              )}
            >
              {showGymDetailsHeader ? (
                <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-3 lg:max-w-[40%]">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="size-11 shrink-0 cursor-pointer p-0 text-foreground hover:bg-transparent hover:text-primary"
                      aria-label={t("misc.back")}
                    >
                      {isGymHeaderMobileViewport ? (
                        <span className="relative inline-flex size-full items-center justify-center">
                          <span
                            className="absolute inset-0 flex items-center justify-center transition-opacity duration-220 ease-out"
                            style={{ opacity: 1 - mergeProgress }}
                          >
                            <span className="bg-overlay/70 inline-flex items-center justify-center rounded-md p-1.5 text-foreground">
                              <WebAppIcon
                                family="MaterialIcons"
                                name={chevronLeftIcon}
                                size={28}
                                className="text-current"
                              />
                            </span>
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center text-foreground">
                            <WebAppIcon
                              family="MaterialIcons"
                              name={chevronLeftIcon}
                              size={28}
                              className="text-current"
                            />
                          </span>
                        </span>
                      ) : (
                        <WebAppIcon
                          family="MaterialIcons"
                          name={chevronLeftIcon}
                          size={36}
                        />
                      )}
                    </Button>

                    <div
                      className="min-w-0 transition-[opacity,transform] duration-220 ease-out"
                      style={
                        showGymDetailsHeader
                          ? {
                              opacity: mergeProgress,
                              transform: isGymHeaderMobileViewport
                                ? `translateY(${(1 - mergeProgress) * 10}px) translateX(${(1 - mergeProgress) * 20}px)`
                                : `translateY(${(1 - mergeProgress) * 8}px)`,
                            }
                          : undefined
                      }
                    >
                      <p className="truncate text-xl font-semibold text-foreground lg:text-2xl">
                        {gymHeaderTitle}
                      </p>
                      {gymHeaderDetails?.gymCategory ? (
                        <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                          <WebAppIcon
                            family="MaterialCommunityIcons"
                            name={
                              GYM_CATEGORY_ICON_PATHS[
                                gymHeaderDetails.gymCategory
                              ]
                            }
                            size={IconSizes.lg}
                            className="shrink-0"
                          />
                          <span className="truncate text-md font-medium">
                            {gymHeaderCategoryLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center lg:flex">
                    <div className="flex items-center gap-8">
                      {(
                        [
                          {
                            key: "reviews",
                            label: t("gymDetails.reviews.label"),
                          },
                          {
                            key: "amenities",
                            label: t("gymDetails.amenities.label"),
                          },
                          {
                            key: "location",
                            label: t("gymDetails.location.label"),
                          },
                        ] as Array<{ key: GymDetailsSectionKey; label: string }>
                      ).map((item) => (
                        <button
                          key={`gym-details-header-link-${item.key}`}
                          type="button"
                          onClick={() => scrollToGymDetailsSection(item.key)}
                          className="text-md cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-primary"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center pl-3">
                    <GymDetailsHeaderActions
                      gymId={gymRouteId}
                      gymName={gymHeaderTitle}
                      buttonClassName="size-11"
                      heartSize={26}
                      shareSize={26}
                      variant={isGymHeaderMobileViewport ? "mobile" : "desktop"}
                      mergeProgress={mergeProgress}
                      shareImageUrl={gymHeaderDetails?.images?.[0]}
                      shareCityLabel={
                        gymHeaderDetails?.city
                          ? `${gymHeaderDetails.city.name}, ${gymHeaderDetails.city.country}`
                          : undefined
                      }
                      shareCategoryLabel={gymHeaderCategoryLabel || undefined}
                      shareRatingAverage={
                        gymHeaderDetails?.rating?.calculatedAverage ?? undefined
                      }
                      shareReviewCount={
                        gymHeaderDetails?.rating?.count ?? undefined
                      }
                      shareScheduleText={
                        gymHeaderDetails?.schedule
                          ? t(
                              `landing.webGymCard.schedule.${resolveScheduleState(gymHeaderDetails.schedule).textKey}`,
                            )
                          : undefined
                      }
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center min-[1200px]:gap-4 min-[1600px]:gap-8 min-[2100px]:gap-12">
                    <Link
                      href="/"
                      aria-label={t("header.brandHomeAriaLabel")}
                      className={cn(
                        "flex items-center space-x-2 min-[1200px]:mr-2 min-[1600px]:mr-8 min-[2100px]:mr-16",
                      )}
                    >
                      <Image
                        src="/assets/logoFull.png"
                        alt={t("header.brandAlt")}
                        width={160}
                        height={40}
                        className="hidden h-8 w-auto min-[500px]:block"
                      />
                      <Image
                        src="/assets/logo.png"
                        alt={t("header.brandAlt")}
                        width={32}
                        height={32}
                        className="size-8 min-[500px]:hidden"
                      />
                    </Link>

                    <div className="hidden min-[1200px]:block">
                      <ul className="flex items-center gap-8 text-sm">
                        {marketingNavItems.map((item) => {
                          const itemPath = item.href.split("#")[0] || "/";
                          const active = isHashNavItem(item.href)
                            ? false
                            : isPathInScope(pathname ?? "/", itemPath);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "text-md block duration-150",
                                  active
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-primary",
                                )}
                              >
                                <span>{item.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {(headerVariant === "app" ||
                    isMarketingContentRoute ||
                    isAuthContentRoute) && (
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center lg:flex">
                      <ul
                        className="flex items-center gap-8 transition-[opacity,transform] duration-120 ease-out"
                        style={{
                          opacity: navItemsOpacity,
                          transform: `translateY(${navSlideOffset}px)`,
                          pointerEvents:
                            showTopLevelAppNav && !collapseAppCenter
                              ? "auto"
                              : "none",
                        }}
                      >
                        {appNavItems.map((item) => {
                          const active = isAppNavItemActive(
                            normalizedPathname,
                            item.href,
                          );
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                aria-label={item.name}
                                title={item.name}
                                className={cn(
                                  buttonVariants({
                                    variant: "ghost",
                                    size: "icon-lg",
                                  }),
                                  "size-12 rounded-2xl border border-transparent transition-all duration-150 active:scale-95",
                                  active
                                    ? "text-primary hover:bg-transparent hover:text-primary"
                                    : "text-muted-foreground hover:bg-transparent hover:text-primary",
                                )}
                              >
                                <WebAppIcon
                                  family={item.icon.family}
                                  name={item.icon.name}
                                  size={26}
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="hidden items-center gap-4 lg:flex">
                    <div className="hidden min-[1200px]:block">
                      <ThemeToggleClient triggerClassName="size-9 [&_svg]:scale-110" />
                    </div>

                    {user ? (
                      <div className="flex items-center gap-3">
                        <Popover>
                          <PopoverTrigger
                            render={
                              <button
                                type="button"
                                className="inline-flex h-9 items-center gap-2.5 rounded-lg px-2 text-right transition-colors hover:bg-muted/60 focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none aria-expanded:bg-muted/60"
                                aria-label={t("header.user.openAccountMenu")}
                              >
                                <div className="flex min-w-0 flex-col justify-center leading-tight">
                                  <>
                                    <p className="truncate leading-tight text-md font-semibold text-foreground">
                                      {userDisplayName}
                                    </p>
                                    <p className="truncate text-sm leading-tight text-muted-foreground">
                                      {roleLabel ??
                                        t("header.user.roles.gymHunterUser")}
                                    </p>
                                  </>
                                </div>

                                <Avatar size="default" className="size-8">
                                  <AvatarImage
                                    src={user.photoURL ?? undefined}
                                    alt={userDisplayName}
                                  />
                                  <AvatarFallback>{userInitial}</AvatarFallback>
                                </Avatar>
                              </button>
                            }
                          />
                          <PopoverContent align="end" className="w-56">
                            <Button
                              variant="ghost"
                              className="h-8 w-full justify-start"
                              onClick={() => {
                                setMenuState(false);
                                router.push("/profile");
                              }}
                            >
                              {t("header.user.editProfile")}
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-full justify-start text-destructive hover:text-destructive"
                              onClick={() => void handleLogoutClick()}
                              disabled={isLoggingOut}
                            >
                              <WebAppIcon
                                family="MaterialIcons"
                                name={logoutOutlinedIcon}
                                size={IconSizes.xl}
                              />
                              {t("header.user.logOut")}
                            </Button>
                          </PopoverContent>
                        </Popover>

                        {isLoggingOut && <Spinner className="size-4" />}
                      </div>
                    ) : (
                      !isAuthLoading && (
                        <>
                          <Button compact onClick={handleLoginClick}>
                            <WebAppIcon
                              family="MaterialIcons"
                              name={loginOutlinedIcon}
                              size={IconSizes.xl}
                            />
                            <span className="text-md font-medium">
                              {t("header.auth.logIn")}
                            </span>
                          </Button>
                          <Button
                            compact
                            variant="secondary"
                            onClick={handleRegisterClick}
                          >
                            <WebAppIcon
                              family="MaterialIcons"
                              name={personAddAlt1OutlinedIcon}
                              size={IconSizes.xl}
                            />
                            <span className="text-md font-medium">
                              {t("header.auth.register")}
                            </span>
                          </Button>
                        </>
                      )
                    )}

                    <button
                      onClick={() => setMenuState(!menuState)}
                      className="relative z-20 hidden cursor-pointer p-1.5 lg:max-[1199px]:block"
                    >
                      <WebAppIcon
                        family="Ionicons"
                        name={menuOutlineIcon}
                        className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-5 duration-200"
                      />
                      <WebAppIcon
                        family="MaterialCommunityIcons"
                        name={closeIcon}
                        className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200"
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 lg:hidden">
                    {user ? (
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger
                            render={
                              <button
                                type="button"
                                className="inline-flex max-w-[175px] items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none aria-expanded:bg-muted/60"
                                aria-label={t("header.user.openAccountMenu")}
                              >
                                <div className="flex min-w-0 flex-col leading-tight">
                                  <>
                                    <p className="truncate text-lg font-medium text-foreground">
                                      {userDisplayName}
                                    </p>
                                    <p className="truncate text-md text-muted-foreground">
                                      {roleLabel ??
                                        t("header.user.roles.gymHunterUser")}
                                    </p>
                                  </>
                                </div>

                                <Avatar size="default" className="size-8">
                                  <AvatarImage
                                    src={user.photoURL ?? undefined}
                                    alt={userDisplayName}
                                  />
                                  <AvatarFallback>{userInitial}</AvatarFallback>
                                </Avatar>
                              </button>
                            }
                          />
                          <PopoverContent align="end" className="w-56">
                            <Button
                              variant="ghost"
                              className="h-8 w-full justify-start"
                              onClick={() => {
                                setMenuState(false);
                                router.push("/profile");
                              }}
                            >
                              {t("header.user.editProfile")}
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-full justify-start text-destructive hover:text-destructive"
                              onClick={() => void handleLogoutClick()}
                              disabled={isLoggingOut}
                            >
                              <WebAppIcon
                                family="MaterialIcons"
                                name={logoutOutlinedIcon}
                                size={IconSizes.xl}
                              />
                              {t("header.user.logOut")}
                            </Button>
                          </PopoverContent>
                        </Popover>

                        {isLoggingOut && <Spinner className="size-4" />}
                      </div>
                    ) : (
                      !isAuthLoading && (
                        <>
                          <Button
                            compact
                            onClick={handleLoginClick}
                            className="gap-1 px-2.5"
                          >
                            <WebAppIcon
                              family="MaterialIcons"
                              name={loginOutlinedIcon}
                              size={IconSizes.lg}
                            />
                            <span className="text-sm font-medium">
                              {t("header.auth.logIn")}
                            </span>
                          </Button>
                          <Button
                            compact
                            variant="secondary"
                            onClick={handleRegisterClick}
                            className="gap-1 px-2.5"
                          >
                            <WebAppIcon
                              family="MaterialIcons"
                              name={personAddAlt1OutlinedIcon}
                              size={IconSizes.lg}
                            />
                            <span className="text-sm font-medium">
                              {t("header.auth.register")}
                            </span>
                          </Button>
                        </>
                      )
                    )}

                    <button
                      onClick={() => setMenuState(!menuState)}
                      aria-label={
                        menuState === true
                          ? t("header.mobile.closeMenu")
                          : t("header.mobile.openMenu")
                      }
                      className="relative z-20 -m-2.5 block cursor-pointer p-2.5"
                    >
                      <WebAppIcon
                        family="Ionicons"
                        name={menuOutlineIcon}
                        className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200"
                      />
                      <WebAppIcon
                        family="MaterialCommunityIcons"
                        name={closeIcon}
                        className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200"
                      />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div
              className="w-full overflow-hidden transition-[max-height,opacity,margin-top] duration-300 ease-out min-[1200px]:hidden"
              style={{
                maxHeight: menuState ? mobileMenuContentHeight : 0,
                opacity: menuState ? 1 : 0,
                marginTop: menuState ? 16 : 0,
              }}
              aria-hidden={!menuState}
            >
              <div ref={mobileMenuContentRef} className="relative">
                <ul className="space-y-6 pr-16 text-xl">
                  {mobileMenuItems.map((item) => {
                    const active =
                      item.scope === "marketing"
                        ? isHashNavItem(item.href)
                          ? false
                          : isPathInScope(
                              pathname ?? "/",
                              item.href.split("#")[0] || "/",
                            )
                        : isAppNavItemActive(pathname ?? "/", item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuState(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2 duration-150 text-md",
                            active
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-primary",
                          )}
                        >
                          {item.icon ? (
                            <WebAppIcon
                              family={item.icon.family}
                              name={item.icon.name}
                              size={IconSizes["3xl"]}
                            />
                          ) : null}
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="absolute right-0 bottom-0">
                  <ThemeToggleClient />
                </div>
              </div>
            </div>
            <div
              className={cn(
                "overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-out",
                showFeedHeaderTabs
                  ? "pointer-events-auto"
                  : "pointer-events-none",
              )}
              style={{
                maxHeight: showFeedHeaderTabs ? feedTabsContentHeight : 0,
                opacity: showFeedHeaderTabs ? 1 : 0,
                transform: showFeedHeaderTabs
                  ? "translateY(0)"
                  : "translateY(-10px)",
                marginTop: showFeedHeaderTabs
                  ? shouldShowFeedTabsOnlyMobile
                    ? 0
                    : 0
                  : 0,
              }}
              aria-hidden={!showFeedHeaderTabs}
            >
              <div ref={feedTabsContentRef} className="w-full">
                <div
                  className={cn(
                    "w-full",
                    shouldShowFeedTabsOnlyMobile &&
                      "relative left-1/2 w-screen -translate-x-1/2 sm:left-0 sm:w-full sm:translate-x-0",
                  )}
                >
                  <div className="mx-auto w-full sm:max-w-md">
                    <Tabs
                      value={feedHeaderTab}
                      onValueChange={handleFeedHeaderTabChange}
                      className="w-full"
                    >
                      <TabsList
                        variant="underline"
                        className="grid w-full grid-cols-2 gap-0"
                      >
                        <TabsTrigger
                          value="explore"
                          className={(state) =>
                            feedTabTriggerClass(state.active)
                          }
                        >
                          <WebAppIcon
                            family="MaterialCommunityIcons"
                            name={mdiSearchWeb}
                            size={IconSizes["2xl"]}
                            className="shrink-0"
                          />
                          Explore
                        </TabsTrigger>
                        <TabsTrigger
                          value="nearby"
                          className={(state) =>
                            feedTabTriggerClass(state.active)
                          }
                        >
                          <WebAppIcon
                            family="MaterialCommunityIcons"
                            name={mdiMapMarkerStar}
                            size={IconSizes["2xl"]}
                            className="shrink-0"
                          />
                          Nearby
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                <div id={FEED_HEADER_CONTROLS_SLOT_ID} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div
        aria-hidden="true"
        className="h-0 transition-[height] duration-300 ease-out"
        style={{
          height: showFeedHeaderTabs ? feedTabsContentHeight : 0,
        }}
      />
      <div
        aria-hidden="true"
        className="h-0 transition-[height] duration-300 ease-out"
        style={{
          height: menuState ? mobileMenuContentHeight + 16 : 0,
        }}
      />
      {(headerVariant === "app" ||
        isMarketingContentRoute ||
        isAuthContentRoute) &&
        !shouldHideMobileBottomNav && (
          <div
            className={cn(
              "w-full shrink-0 overflow-hidden lg:hidden",
              shouldUseInFlowMobileBottomNav
                ? "pointer-events-auto relative inset-auto bottom-auto z-auto mt-0"
                : "pointer-events-none fixed inset-x-0 bottom-0 z-30",
            )}
          >
            <div
              className={cn(
                "w-full transform-gpu transition-transform duration-300 ease-out",
                shouldUseInFlowMobileBottomNav
                  ? "pointer-events-auto translate-y-0"
                  : menuState || isMobileBottomNavHidden
                  ? "pointer-events-none translate-y-full"
                  : "pointer-events-auto translate-y-0",
              )}
            >
              <ul className="grid grid-cols-5 items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
                {mobileBottomNavItems.map((item) => {
                  const active = isAppNavItemActive(
                    normalizedPathname,
                    item.href,
                  );
                  return (
                    <li key={`bottom-mobile-app-nav-${item.href}`}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuState(false)}
                        aria-current={active ? "page" : undefined}
                        aria-label={item.name}
                        title={item.name}
                        className={cn(
                          "flex h-14 min-w-0 items-center justify-center px-1.5 transition-transform duration-150 active:scale-95",
                          active
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary",
                        )}
                      >
                        <WebAppIcon
                          family={item.icon.family}
                          name={item.icon.name}
                          size={IconSizes["3xl"]}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
    </header>

);
};

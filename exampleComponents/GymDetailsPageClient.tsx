"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { markGymAsViewed } from "@/backendCalls/backendService";
import { WebAppIcon, type WebAppIconName } from "@/components/WebAppIcon";
import { GymLocationMapSurface } from "@/components/app/gym-details/GymLocationMapSurface";
import { WebAmenityChip } from "@/components/app/gym-details/WebAmenityChip";
import { WebReviewCard } from "@/components/app/gym-details/WebReviewCard";
import { WebGymReviewsDialog } from "@/components/app/gym-details/WebGymReviewsDialog";
import { MOCK_GYM_REVIEWS } from "@/components/app/gym-details/mockGymReviews";
import { WebPlanCard } from "@/components/app/gym-details/WebPlanCard";
import { FeedScrollablePanel } from "@/components/app/feed/FeedScrollablePanel";
import { Button } from "@/components/ui/button";
import { GymDetailsHeaderActions } from "@/components/app/gym-details/GymDetailsHeaderActions";
import {
  WebImageViewer,
  type WebImageViewerImage,
} from "@/components/WebImageViewer";
import {
  GYM_DETAILS_MOBILE_INTRO_ID,
  useGymDetailsHeaderMerge,
} from "@/components/app/gym-details/useGymDetailsHeaderMerge";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAuthUser,
  useGymPricingPlans,
  useGymPublicDetails,
  useGymReviews,
  useUserData,
} from "@/hooks/useFirestore";
import { buildSignInDialogUrl } from "@/lib/authDialog";
import { buildGymDetailsUrl } from "@/lib/gymUrls";
import { cn } from "@/lib/utils";
import type {
  GymCategory,
  GymSchedule,
  PlanType,
  SocialLinks,
} from "@/types/backendTypes";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const CATEGORY_ICON_NAMES = {
  strength: "dumbbell",
  wellness: "spa-outline",
  combat: "karate",
  sports: "soccer",
  movement: "yoga",
  performance: "share-variant-outline",
} as const satisfies Record<
  GymCategory,
  WebAppIconName<"MaterialCommunityIcons">
>;

const SOCIAL_ICON_NAMES = {
  instagram: "instagram",
  facebook: "facebook",
  youtube: "play-circle-outline",
  tiktok: "share-variant-outline",
} as const satisfies Record<
  keyof SocialLinks,
  WebAppIconName<"MaterialCommunityIcons">
>;

const GYM_DETAILS_SECTION_IDS = {
  reviews: "gym-details-reviews",
  amenities: "gym-details-amenities",
  location: "gym-details-location",
} as const;
const COMPACT_DESKTOP_RAIL_CLASS = "sm:max-w-[1232px]";

const buildConversationId = (uid: string, gymId: string) =>
  `user:${uid}-gym:${gymId}`;

const hasToDate = (value: unknown): value is { toDate: () => Date } =>
  typeof value === "object" &&
  value !== null &&
  "toDate" in value &&
  typeof (value as { toDate?: unknown }).toDate === "function";

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (hasToDate(value)) return value.toDate();
  return null;
};

const parseTimeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const resolveScheduleState = (schedule: GymSchedule | null) => {
  if (!schedule) return { isOpen: false, textKey: "closed" as const };

  const currentDay = DAY_KEYS[(new Date().getDay() + 6) % 7];
  const todaySchedule = schedule[currentDay];
  if (!todaySchedule?.isOpen) {
    return { isOpen: false, textKey: "closed" as const };
  }

  const openingMinutes = parseTimeToMinutes(todaySchedule.openingTime);
  const closingMinutes = parseTimeToMinutes(todaySchedule.closingTime);
  if (openingMinutes === null || closingMinutes === null) {
    return { isOpen: false, textKey: "closed" as const };
  }

  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const isOpen =
    closingMinutes >= openingMinutes
      ? now >= openingMinutes && now < closingMinutes
      : now >= openingMinutes || now < closingMinutes;

  return { isOpen, textKey: isOpen ? ("open" as const) : ("closed" as const) };
};

const formatCurrency = (value: number, currencyCode: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value}`;
  }
};

const getPlanSubtitle = (
  plan: PlanType,
  t: ReturnType<typeof useTranslation>["t"],
) => {
  if (plan.type === "subscription") {
    const billingPeriodLabel =
      plan.billingPeriod === "weekly"
        ? t("billingPeriodOptions.weekly", { defaultValue: "Weekly" })
        : plan.billingPeriod === "yearly"
          ? t("billingPeriodOptions.yearly", { defaultValue: "Yearly" })
          : t("billingPeriodOptions.monthly", { defaultValue: "Monthly" });
    return billingPeriodLabel;
  }

  if (typeof plan.validityPeriod === "number" && plan.validityPeriod > 0) {
    return t("gymDetails.price.validForDays", {
      count: plan.validityPeriod,
      defaultValue:
        plan.validityPeriod === 1
          ? "Valid for 1 day"
          : `Valid for ${plan.validityPeriod} days`,
    });
  }

  return t("gymDetails.price.oneTime", { defaultValue: "One-time purchase" });
};

const getTopPlan = (plans: PlanType[]) => {
  if (plans.length === 0) return null;
  return plans.reduce((lowest, current) =>
    current.userPrice < lowest.userPrice ? current : lowest,
  );
};

const DAY_LABELS = {
  monday: {
    shortKey: "bossScreen.gymWizard.step1.mondayShort",
    fullKey: "bossScreen.gymWizard.step1.monday",
    shortFallback: "Mon",
    fullFallback: "Monday",
  },
  tuesday: {
    shortKey: "bossScreen.gymWizard.step1.tuesdayShort",
    fullKey: "bossScreen.gymWizard.step1.tuesday",
    shortFallback: "Tue",
    fullFallback: "Tuesday",
  },
  wednesday: {
    shortKey: "bossScreen.gymWizard.step1.wednesdayShort",
    fullKey: "bossScreen.gymWizard.step1.wednesday",
    shortFallback: "Wed",
    fullFallback: "Wednesday",
  },
  thursday: {
    shortKey: "bossScreen.gymWizard.step1.thursdayShort",
    fullKey: "bossScreen.gymWizard.step1.thursday",
    shortFallback: "Thu",
    fullFallback: "Thursday",
  },
  friday: {
    shortKey: "bossScreen.gymWizard.step1.fridayShort",
    fullKey: "bossScreen.gymWizard.step1.friday",
    shortFallback: "Fri",
    fullFallback: "Friday",
  },
  saturday: {
    shortKey: "bossScreen.gymWizard.step1.saturdayShort",
    fullKey: "bossScreen.gymWizard.step1.saturday",
    shortFallback: "Sat",
    fullFallback: "Saturday",
  },
  sunday: {
    shortKey: "bossScreen.gymWizard.step1.sundayShort",
    fullKey: "bossScreen.gymWizard.step1.sunday",
    shortFallback: "Sun",
    fullFallback: "Sunday",
  },
} as const;

function SectionHeader({
  iconName,
  title,
  subtitle,
}: {
  iconName: WebAppIconName<"MaterialCommunityIcons">;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <WebAppIcon
          family="MaterialCommunityIcons"
          name={iconName}
          size="lg"
          className="shrink-0 text-foreground"
        />
        <h2 className="text-md font-semibold text-foreground">{title}</h2>
      </div>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function GymDetailsMedia({
  gymId,
  images,
  gymName,
  shareCityLabel,
  shareCategoryLabel,
  shareRatingAverage,
  shareReviewCount,
  shareStartingPriceText,
  shareScheduleText,
  shareIsRecommended,
}: {
  gymId: string;
  images: string[];
  gymName: string;
  shareCityLabel?: string;
  shareCategoryLabel?: string;
  shareRatingAverage?: number;
  shareReviewCount?: number;
  shareStartingPriceText?: string;
  shareScheduleText?: string;
  shareIsRecommended?: boolean;
}) {
  const mobileImages = images;
  const [mobileCarouselApi, setMobileCarouselApi] = useState<CarouselApi>();
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
  const [desktopCarouselApi, setDesktopCarouselApi] = useState<CarouselApi>();
  const [desktopCarouselIndex, setDesktopCarouselIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const viewerImages = useMemo<WebImageViewerImage[]>(
    () =>
      (images.length > 0 ? images : [undefined]).map((image, index) => ({
        alt: `${gymName} ${index + 1}`,
        id: `gym-image-${index}`,
        src: image,
      })),
    [gymName, images],
  );

  const renderImage = ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt: string;
    className: string;
  }) => {
    if (!src) {
      return <div className={cn("bg-secondary", className)} />;
    }

    return (
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 1.035, opacity: 0.84 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  };

  useEffect(() => {
    if (!mobileCarouselApi) return;

    const syncSelectedIndex = () => {
      setMobileCarouselIndex(mobileCarouselApi.selectedScrollSnap());
    };

    syncSelectedIndex();
    mobileCarouselApi.on("select", syncSelectedIndex);
    mobileCarouselApi.on("reInit", syncSelectedIndex);

    return () => {
      mobileCarouselApi.off("select", syncSelectedIndex);
      mobileCarouselApi.off("reInit", syncSelectedIndex);
    };
  }, [mobileCarouselApi]);

  useEffect(() => {
    if (!desktopCarouselApi) return;

    const syncSelectedIndex = () => {
      setDesktopCarouselIndex(desktopCarouselApi.selectedScrollSnap());
    };

    syncSelectedIndex();
    desktopCarouselApi.on("select", syncSelectedIndex);
    desktopCarouselApi.on("reInit", syncSelectedIndex);

    return () => {
      desktopCarouselApi.off("select", syncSelectedIndex);
      desktopCarouselApi.off("reInit", syncSelectedIndex);
    };
  }, [desktopCarouselApi]);

  const openViewer = (startIndex: number) => {
    if (images.length === 0) return;
    setViewerStartIndex(startIndex);
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className="md:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openViewer(mobileCarouselIndex)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openViewer(mobileCarouselIndex);
            }
          }}
          className="relative block w-full cursor-pointer overflow-hidden text-left"
          aria-label={`Open ${gymName} images`}
        >
          <Carousel
            setApi={setMobileCarouselApi}
            opts={{ loop: mobileImages.length > 1 }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {(mobileImages.length > 0 ? mobileImages : [undefined]).map(
                (image, index) => (
                  <CarouselItem
                    key={`${image ?? "gym-image-fallback"}-${index}`}
                    className="pl-0"
                  >
                    {renderImage({
                      src: image,
                      alt: `${gymName} ${index + 1}`,
                      className: "aspect-[1.31/1] w-full",
                    })}
                  </CarouselItem>
                ),
              )}
            </CarouselContent>
          </Carousel>

          {mobileImages.length > 0 ? (
            <div className="bg-overlay/70 absolute right-4 bottom-4 inline-flex items-center justify-center rounded-sm px-2 py-1.5">
              <span className="text-sm leading-[1] text-foreground">
                {mobileCarouselIndex + 1} / {mobileImages.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="w-full px-4 pt-5 sm:px-8 md:px-12 xl:px-16">
          <div className={cn("mx-auto w-full", COMPACT_DESKTOP_RAIL_CLASS)}>
            <div className="relative block w-full text-left">
              <Carousel
                setApi={setDesktopCarouselApi}
                opts={{ loop: images.length > 1 }}
                className="w-full"
              >
                <div className="relative overflow-hidden rounded-2xl">
                  <CarouselContent className="ml-0">
                    {(images.length > 0 ? images : [undefined]).map(
                      (image, index) => (
                        <CarouselItem
                          key={`${image ?? "gym-image-fallback-desktop"}-${index}`}
                          className="pl-0"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openViewer(index)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openViewer(index);
                              }
                            }}
                            className="block w-full cursor-pointer"
                            aria-label={`Open ${gymName} image ${index + 1}`}
                          >
                            {renderImage({
                              src: image,
                              alt: `${gymName} ${index + 1}`,
                              className: "aspect-[2.77/1] w-full",
                            })}
                          </div>
                        </CarouselItem>
                      ),
                    )}
                  </CarouselContent>

                  {images.length > 0 ? (
                    <div className="bg-overlay/70 absolute right-4 bottom-4 inline-flex items-center justify-center rounded-md px-3 py-2">
                      <span className="text-md leading-[1] font-normal text-foreground">
                        {desktopCarouselIndex + 1} / {images.length}
                      </span>
                    </div>
                  ) : null}
                </div>

                {images.length > 1 ? (
                  <>
                    <CarouselPrevious
                      variant="secondary"
                      size="icon"
                      className="bg-secondary text-foreground hover:bg-secondary hover:text-primary left-2 size-12 translate-y-0 border-0 top-1/2 -translate-y-1/2 shadow-none disabled:opacity-35 md:-left-20 md:size-14 [&_svg]:size-9"
                    />
                    <CarouselNext
                      variant="secondary"
                      size="icon"
                      className="bg-secondary text-foreground hover:bg-secondary hover:text-primary right-2 size-12 translate-y-0 border-0 top-1/2 -translate-y-1/2 shadow-none disabled:opacity-35 md:-right-20 md:size-14 [&_svg]:size-9"
                    />
                  </>
                ) : null}
              </Carousel>
            </div>
          </div>
        </div>
      </div>

      <WebImageViewer
        images={viewerImages}
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        startIndex={viewerStartIndex}
        headerComponents={({ currentImage }) => (
          <GymDetailsHeaderActions
            gymId={gymId}
            gymName={gymName}
            buttonClassName="size-11"
            heartSize={26}
            shareSize={26}
            variant="desktop"
            desktopIconClassName=""
            dialogContentClassName="z-[130]"
            dialogOverlayClassName="z-[129] bg-black/55 supports-backdrop-filter:backdrop-blur-xs"
            forceDesktopIconColorClassName="text-foreground"
            forceDesktopHoverColorClassName="hover:text-primary"
            shareImageUrl={currentImage?.src ?? images[0]}
            shareCityLabel={shareCityLabel}
            shareCategoryLabel={shareCategoryLabel}
            shareRatingAverage={shareRatingAverage}
            shareReviewCount={shareReviewCount}
            shareStartingPriceText={shareStartingPriceText}
            shareScheduleText={shareScheduleText}
            shareIsRecommended={shareIsRecommended}
          />
        )}
      />
    </>
  );
}

function GymDetailsLocationOverlay({
  open,
  onOpenChange,
  gymName,
  latitude,
  longitude,
  label,
  gymCategory,
  isMobileViewport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymName: string;
  latitude: number;
  longitude: number;
  label: string;
  gymCategory?: GymCategory;
  isMobileViewport: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isMobileViewport || !open || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileViewport, open]);

  if (isMobileViewport) {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-[120] h-dvh min-h-dvh w-screen bg-background text-foreground">
        <div className="bg-background/95 absolute inset-x-0 top-0 z-20 border-b backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 sm:px-8 md:px-12 xl:px-16">
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 text-foreground hover:bg-transparent hover:text-primary"
              onClick={() => onOpenChange(false)}
              aria-label={t("misc.back", { defaultValue: "Back" })}
            >
              <WebAppIcon
                family="MaterialIcons"
                name="chevron-left"
                size={32}
              />
            </Button>
            <p className="min-w-0 truncate text-lg font-semibold text-foreground">
              {t("gymDetails.gymLocation.locationOf", {
                gymName,
                defaultValue: `Location of ${gymName}`,
              })}
            </p>
          </div>
        </div>

        <div className="h-full pt-16">
          <GymLocationMapSurface
            latitude={latitude}
            longitude={longitude}
            label={label}
            gymName={gymName}
            gymCategory={gymCategory}
            isRecommended={false}
            interactive
            showBottomLabel={false}
            surfaceClassName="h-full rounded-none"
            mapClassName="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        closeOnOverlayClick={false}
        className="left-1/2 top-1/2 z-[120] h-[90dvh] w-[90vw] max-w-none -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-0 bg-background p-0 text-foreground shadow-none ring-0 sm:max-w-[90vw] lg:max-w-[1600px]"
      >
        <div className="absolute right-4 top-4 z-20">
          <Button
            type="button"
            variant="ghost"
            className="size-11 rounded-full bg-overlay/70 p-0 text-foreground hover:bg-overlay/80 hover:text-primary"
            onClick={() => onOpenChange(false)}
            aria-label={t("misc.close", { defaultValue: "Close" })}
          >
            <WebAppIcon family="MaterialIcons" name="close" size={30} />
          </Button>
        </div>

        <div className="h-full">
          <GymLocationMapSurface
            latitude={latitude}
            longitude={longitude}
            label={label}
            gymName={gymName}
            gymCategory={gymCategory}
            isRecommended={false}
            interactive
            showBottomLabel={false}
            surfaceClassName="h-full rounded-none"
            mapClassName="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GymDetailsPageClient() {
  const { t } = useTranslation();
  const params = useParams<{ gymId: string; gymSlug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);
  const reviewsRowRef = useRef<HTMLDivElement | null>(null);
  const leftDetailsColumnRef = useRef<HTMLDivElement | null>(null);
  const { isMobileViewport, mergeProgress } = useGymDetailsHeaderMerge(true);
  const [isLocationOverlayOpen, setIsLocationOverlayOpen] = useState(false);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [desktopLeftColumnHeight, setDesktopLeftColumnHeight] = useState<
    number | null
  >(null);
  const [canScrollReviewsPrev, setCanScrollReviewsPrev] = useState(false);
  const [canScrollReviewsNext, setCanScrollReviewsNext] = useState(false);
  const [reviewsOverflowing, setReviewsOverflowing] = useState(false);

  const gymId = params?.gymId?.trim() ?? "";
  const gymSlug = params?.gymSlug?.trim() ?? "";

  const { user } = useAuthUser();
  const { data: userData } = useUserData(user?.uid ?? null);
  const { data: gym, isLoading: isGymLoading } = useGymPublicDetails(
    gymId || null,
  );
  const { data: pricingPlans = [], isLoading: isPricingLoading } =
    useGymPricingPlans(gymId || null);
  const { data: reviews = [], isLoading: isReviewsLoading } = useGymReviews(
    gymId || null,
    10,
  );

  const [selectedScheduleDay, setSelectedScheduleDay] = useState<
    (typeof DAY_KEYS)[number]
  >(DAY_KEYS[0]);
  const [selectedPricingPlanId, setSelectedPricingPlanId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!gym) return;
    if (
      buildGymDetailsUrl({ gymId: gym.gymId, gymName: gym.gymName }) !==
      pathname
    ) {
      router.replace(
        buildGymDetailsUrl({ gymId: gym.gymId, gymName: gym.gymName }),
      );
    }
  }, [gym, pathname, router]);

  useEffect(() => {
    if (!gymId || !user?.uid) return;
    const timeoutId = window.setTimeout(() => {
      void markGymAsViewed(gymId);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [gymId, user?.uid]);

  useEffect(() => {
    const currentDayIndex = Math.max(0, new Date().getDay() - 1);
    setSelectedScheduleDay(DAY_KEYS[currentDayIndex] ?? DAY_KEYS[0]);
  }, [gymId]);

  const primaryPlan = useMemo(() => getTopPlan(pricingPlans), [pricingPlans]);
  const sortedPricingPlans = useMemo(
    () =>
      [...pricingPlans].sort((left, right) => left.userPrice - right.userPrice),
    [pricingPlans],
  );
  const selectedPricingPlan = useMemo(
    () =>
      sortedPricingPlans.find(
        (plan) => plan.pricingPlanId === selectedPricingPlanId,
      ) ??
      sortedPricingPlans[0] ??
      null,
    [selectedPricingPlanId, sortedPricingPlans],
  );

  const categoryLabel = useMemo(() => {
    if (!gym?.gymCategory) return "";
    return t(`gymCategories.${gym.gymCategory}`, {
      defaultValue: gym.gymCategory,
    });
  }, [gym?.gymCategory, t]);

  const shareScheduleText = useMemo(() => {
    if (!gym?.schedule) return undefined;
    const scheduleState = resolveScheduleState(gym.schedule);
    return t(`landing.webGymCard.schedule.${scheduleState.textKey}`, {
      defaultValue: scheduleState.textKey === "open" ? "Open" : "Closed",
    });
  }, [gym?.schedule, t]);

  const shareStartingPriceText = useMemo(() => {
    if (!primaryPlan || !gym?.currencyCode) return undefined;
    return formatCurrency(primaryPlan.userPrice, gym.currencyCode);
  }, [gym?.currencyCode, primaryPlan]);

  const socialLinks = useMemo(
    () =>
      gym?.socialLinks
        ? (
            Object.entries(gym.socialLinks) as Array<
              [keyof SocialLinks, string | null]
            >
          ).filter(
            ([, value]) => typeof value === "string" && value.trim().length > 0,
          )
        : [],
    [gym?.socialLinks],
  );
  const reviewCount = gym?.rating?.count ?? 0;
  const averageRating = gym?.rating?.calculatedAverage ?? 0;
  const displayReviews = useMemo(() => {
    if (process.env.NODE_ENV !== "development") return reviews;
    if (reviews.length >= 10) return reviews;

    const usedIds = new Set(reviews.map((review) => review.uid));
    const missingMocks = MOCK_GYM_REVIEWS.filter(
      (review) => !usedIds.has(review.uid),
    ).slice(0, 10 - reviews.length);

    return [...reviews, ...missingMocks];
  }, [reviews]);
  const displayReviewCount =
    process.env.NODE_ENV === "development"
      ? displayReviews.length
      : reviewCount;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const node = leftDetailsColumnRef.current;
    if (!node) return;

    const updateHeight = () => {
      if (window.innerWidth < 1024) {
        setDesktopLeftColumnHeight(null);
        return;
      }

      setDesktopLeftColumnHeight(
        Math.round(node.getBoundingClientRect().height),
      );
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [
    gym,
    pricingPlans.length,
    reviews.length,
    selectedScheduleDay,
    socialLinks.length,
  ]);

  useEffect(() => {
    if (sortedPricingPlans.length === 0) {
      setSelectedPricingPlanId(null);
      return;
    }

    setSelectedPricingPlanId((currentValue) => {
      if (
        currentValue &&
        sortedPricingPlans.some((plan) => plan.pricingPlanId === currentValue)
      ) {
        return currentValue;
      }

      return sortedPricingPlans[0]?.pricingPlanId ?? null;
    });
  }, [sortedPricingPlans]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!gym?.gymName) return;

    document.title = `${gym.gymName} | GymHunter`;
  }, [gym?.gymName]);

  const updateReviewsScrollControls = useCallback(() => {
    const element = reviewsRowRef.current;
    if (!element) {
      setCanScrollReviewsPrev(false);
      setCanScrollReviewsNext(false);
      setReviewsOverflowing(false);
      return;
    }

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    const isOverflowing = maxScrollLeft > 4;
    setReviewsOverflowing(isOverflowing);
    setCanScrollReviewsPrev(isOverflowing && element.scrollLeft > 4);
    setCanScrollReviewsNext(
      isOverflowing && maxScrollLeft - element.scrollLeft > 4,
    );
  }, []);

  const scrollReviewsByCards = useCallback(
    (direction: -1 | 1) => {
      const element = reviewsRowRef.current;
      if (!element) return;

      const scrollDelta = Math.max(260, Math.floor(element.clientWidth * 0.8));
      element.scrollBy({
        left: direction * scrollDelta,
        behavior: "smooth",
      });

      window.requestAnimationFrame(() => {
        updateReviewsScrollControls();
      });
    },
    [updateReviewsScrollControls],
  );

  useEffect(() => {
    const element = reviewsRowRef.current;
    if (!element) return;

    const onScroll = () => updateReviewsScrollControls();
    element.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateReviewsScrollControls();
          })
        : null;

    resizeObserver?.observe(element);
    updateReviewsScrollControls();

    return () => {
      element.removeEventListener("scroll", onScroll);
      resizeObserver?.disconnect();
    };
  }, [displayReviews.length, updateReviewsScrollControls]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() =>
      updateReviewsScrollControls(),
    );
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [displayReviews.length, isReviewsLoading, updateReviewsScrollControls]);

  const isWorkspaceMember = useMemo(() => {
    if (!userData || !gymId) return false;
    return (
      userData.ownedGym === gymId ||
      userData.ownedGymObject?.id === gymId ||
      Boolean(userData.staffOfGyms?.includes(gymId)) ||
      Boolean(userData.staffOfGymsObject?.[gymId])
    );
  }, [gymId, userData]);

  const handleMessagePress = () => {
    if (!gymId || !gym) return;
    if (!user?.uid) {
      router.push(buildSignInDialogUrl(pathname || "/"));
      return;
    }
    router.push(`/messages/${buildConversationId(user.uid, gymId)}`);
  };

  if (!gymId || !gymSlug) {
    return (
      <div className="w-full px-4 py-8 sm:px-8 md:px-12 xl:px-16">
        <div
          className={cn("relative mx-auto w-full", COMPACT_DESKTOP_RAIL_CLASS)}
        >
          <Card>
            <CardContent className="pt-4">
              <p className="text-md text-muted-foreground">
                {t("gymDetails.invalidUrl", {
                  defaultValue: "Invalid gym URL.",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isGymLoading || !gym) {
    if (!isGymLoading) {
      return (
        <div className="w-full px-4 py-8 sm:px-8 md:px-12 xl:px-16">
          <div
            className={cn(
              "relative mx-auto w-full",
              COMPACT_DESKTOP_RAIL_CLASS,
            )}
          >
            <Card>
              <CardContent className="pt-4">
                <p className="text-md text-muted-foreground">
                  {t("gymDetails.notFound", { defaultValue: "Gym not found." })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="md:hidden">
          <div className="w-full px-0">
            <div className="relative w-full">
              <Skeleton className="aspect-[1.31/1] w-full rounded-none" />
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="w-full px-4 pt-5 sm:px-8 md:px-12 xl:px-16">
            <div className={cn("mx-auto w-full", COMPACT_DESKTOP_RAIL_CLASS)}>
              <Skeleton className="aspect-[2.77/1] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="pb-6 lg:pb-8">
      <div className="w-full px-0">
        <div className="relative w-full">
          <GymDetailsMedia
            gymId={gymId}
            images={gym.images}
            gymName={gym.gymName}
            shareCityLabel={
              gym.city ? `${gym.city.name}, ${gym.city.country}` : undefined
            }
            shareCategoryLabel={categoryLabel || undefined}
            shareRatingAverage={gym.rating?.calculatedAverage ?? undefined}
            shareReviewCount={gym.rating?.count ?? undefined}
            shareStartingPriceText={shareStartingPriceText}
            shareScheduleText={shareScheduleText}
          />
        </div>
      </div>

      <GymDetailsLocationOverlay
        open={isLocationOverlayOpen}
        onOpenChange={setIsLocationOverlayOpen}
        gymName={gym.gymName}
        latitude={gym.coordinates.latitude}
        longitude={gym.coordinates.longitude}
        label={`${gym.city.name}, ${gym.city.country}`}
        gymCategory={gym.gymCategory}
        isMobileViewport={isMobileViewport}
      />

      <div className="w-full px-4 sm:px-8 md:mt-8 md:px-12 xl:px-16">
        <div
          className={cn(
            "relative mx-auto mt-5 w-full space-y-4",
            COMPACT_DESKTOP_RAIL_CLASS,
          )}
        >
          <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
            <div
              id={GYM_DETAILS_MOBILE_INTRO_ID}
              className="flex w-full flex-col items-center justify-center text-center transition-[opacity,transform] duration-220 ease-out"
              style={{
                opacity: 1 - mergeProgress,
                transform: isMobileViewport
                  ? `translateY(${-28 * mergeProgress}px) translateX(${-20 * mergeProgress}px) scale(${1 - 0.05 * mergeProgress})`
                  : "none",
              }}
            >
              <div className="md:hidden">
                <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {gym.gymName}
                </h1>
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-muted-foreground">
                  <WebAppIcon
                    family="MaterialCommunityIcons"
                    name={CATEGORY_ICON_NAMES[gym.gymCategory]}
                    size="2xl"
                    className="shrink-0"
                  />
                  <span className="text-lg font-medium text-muted-foreground">
                    {categoryLabel}
                  </span>
                </div>
              </div>

              <div className="hidden w-full md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
                <div className="flex justify-start">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    aria-label="Back"
                    className="min-w-0 gap-1 px-0 text-foreground"
                  >
                    <WebAppIcon
                      family="MaterialIcons"
                      name="chevron-left"
                      size={36}
                      className="shrink-0"
                    />
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                  <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground">
                    {gym.gymName}
                  </h1>
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-muted-foreground">
                    <WebAppIcon
                      family="MaterialCommunityIcons"
                      name={CATEGORY_ICON_NAMES[gym.gymCategory]}
                      size="2xl"
                      className="shrink-0"
                    />
                    <span className="text-lg font-medium text-muted-foreground">
                      {categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <GymDetailsHeaderActions
                    gymId={gymId}
                    gymName={gym.gymName}
                    buttonClassName="size-11"
                    heartSize={26}
                    shareSize={26}
                    variant="desktop"
                    shareImageUrl={gym.images[0]}
                    shareCityLabel={`${gym.city.name}, ${gym.city.country}`}
                    shareCategoryLabel={categoryLabel || undefined}
                    shareRatingAverage={
                      gym.rating?.calculatedAverage ?? undefined
                    }
                    shareReviewCount={gym.rating?.count ?? undefined}
                    shareStartingPriceText={shareStartingPriceText}
                    shareScheduleText={shareScheduleText}
                  />
                </div>
              </div>
            </div>

            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
              <div
                ref={leftDetailsColumnRef}
                className="mx-auto w-full max-w-4xl"
              >
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-0 text-center md:items-start md:text-left">
                  <div className="flex w-full flex-wrap items-center justify-center gap-3 md:justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsReviewsDialogOpen(true)}
                      className="h-auto flex-col items-center justify-center rounded-2xl px-4 py-3 md:min-w-44"
                    >
                      <div className="flex items-center gap-1.5">
                        <WebAppIcon
                          family="Ionicons"
                          name="star"
                          size="xl"
                          className="text-foreground"
                        />
                        <span className="text-2xl font-semibold text-foreground">
                          {gym.rating?.calculatedAverage ?? 0}
                        </span>
                      </div>
                      <p className="text-md text-muted-foreground">
                        {reviewCount > 0
                          ? t("gymDetails.reviews.tapToSeeAllReviews", {
                              count: reviewCount,
                              defaultValue: `See all ${reviewCount} reviews`,
                            })
                          : t("gymDetails.reviews.noReviews", {
                              defaultValue: "No reviews yet",
                            })}
                      </p>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleMessagePress}
                      disabled={isWorkspaceMember || Boolean(gym.isMock)}
                      className="h-auto px-6 py-3"
                    >
                      <WebAppIcon
                        family="MaterialCommunityIcons"
                        name="message-outline"
                        size="2xl"
                      />
                      <span>
                        {t("messagesScreen.directMessage", {
                          defaultValue: "Direct message",
                        })}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground md:justify-start">
                    <WebAppIcon
                      family="MaterialCommunityIcons"
                      name="map-marker-outline"
                      size="lg"
                      className="shrink-0"
                    />
                    <span className="text-md font-medium text-foreground">
                      {gym.city.name}, {gym.city.country}
                    </span>
                  </div>

                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-md md:text-left mt-1">
                    {gym.description ||
                      t("gymDetails.noDescription", {
                        defaultValue: "No description available yet.",
                      })}
                  </p>

                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                      {socialLinks.map(([network, rawUrl]) => {
                        const href = rawUrl as string;
                        return (
                          <Link
                            key={network}
                            href={
                              href.startsWith("http") ? href : `https://${href}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="bg-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-md font-medium text-foreground transition-colors hover:bg-secondary/80"
                          >
                            <WebAppIcon
                              family="MaterialCommunityIcons"
                              name={SOCIAL_ICON_NAMES[network]}
                              size="lg"
                            />
                            <span>
                              {t(`socialLinks.${network}`, {
                                defaultValue:
                                  network.charAt(0).toUpperCase() +
                                  network.slice(1),
                              })}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}

                  <Separator className="my-4" />

                  <section className="w-full space-y-4">
                    <SectionHeader
                      iconName="clock-star-four-points"
                      title={t("gymDetails.schedule.label", {
                        defaultValue: "Schedule",
                      })}
                      subtitle={t("gymDetails.schedule.subtitle", {
                        defaultValue:
                          "Check the opening hours for each day of the week.",
                      })}
                    />
                    <Tabs
                      value={selectedScheduleDay}
                      onValueChange={(value) =>
                        setSelectedScheduleDay(
                          value as (typeof DAY_KEYS)[number],
                        )
                      }
                    >
                      <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7">
                        {DAY_KEYS.map((dayKey) => (
                          <TabsTrigger
                            key={dayKey}
                            value={dayKey}
                            className="text-sm"
                          >
                            {t(DAY_LABELS[dayKey].shortKey, {
                              defaultValue: DAY_LABELS[dayKey].shortFallback,
                            })}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {DAY_KEYS.map((dayKey) => {
                        const daySchedule = gym.schedule?.[dayKey];
                        const isOpen = Boolean(daySchedule?.isOpen);
                        return (
                          <TabsContent
                            key={dayKey}
                            value={dayKey}
                            className="pt-1"
                          >
                            <Card size="sm" className="gap-0 rounded-lg py-2.5">
                              <CardContent className="space-y-2 py-0">
                                <p className="text-md font-medium text-foreground">
                                  {t(DAY_LABELS[dayKey].fullKey, {
                                    defaultValue:
                                      DAY_LABELS[dayKey].fullFallback,
                                  })}
                                </p>
                                {isOpen ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <WebAppIcon
                                        family="MaterialCommunityIcons"
                                        name="clock-star-four-points"
                                        size="lg"
                                      />
                                      <div className="flex items-center">
                                        <span className="text-sm">
                                          {t(
                                            "bossScreen.gymWizard.step1.opensAt",
                                            {
                                              defaultValue: "Opens at",
                                            },
                                          )}
                                        </span>
                                        &nbsp;
                                        <span className="text-sm font-medium text-foreground">
                                          {daySchedule?.openingTime}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <WebAppIcon
                                        family="MaterialCommunityIcons"
                                        name="clock-star-four-points-outline"
                                        size="lg"
                                      />
                                      <div className="flex items-center">
                                        <span className="text-sm">
                                          {t(
                                            "bossScreen.gymWizard.step1.closesAt",
                                            {
                                              defaultValue: "Closes at",
                                            },
                                          )}
                                        </span>
                                        &nbsp;
                                        <span className="text-sm font-medium text-foreground">
                                          {daySchedule?.closingTime}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-md text-muted-foreground">
                                    {t("bossScreen.gymWizard.step1.gymClosed", {
                                      defaultValue:
                                        "The gym will be closed on this day.",
                                    })}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </section>

                  <Separator className="my-4" />

                  <section
                    id={GYM_DETAILS_SECTION_IDS.amenities}
                    className="scroll-mt-28 w-full space-y-4"
                  >
                    <SectionHeader
                      iconName="dumbbell"
                      title={t("gymDetails.amenities.label", {
                        defaultValue: "Amenities",
                      })}
                      subtitle={t("gymDetails.amenities.subtitle", {
                        defaultValue:
                          "Everything this gym currently offers on-site.",
                      })}
                    />
                    {gym.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {gym.amenities.map((amenity) => (
                          <WebAmenityChip key={amenity} amenity={amenity} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-md text-muted-foreground">
                        {t("gymDetails.amenities.none", {
                          defaultValue: "No amenities listed yet.",
                        })}
                      </p>
                    )}
                  </section>
                </div>
              </div>

              <div
                className="mx-auto mt-6 flex w-full max-w-xl min-h-0 lg:mt-2"
                style={{
                  maxHeight:
                    desktopLeftColumnHeight && !isMobileViewport
                      ? `${desktopLeftColumnHeight}px`
                      : undefined,
                }}
              >
                <Card className="flex min-h-0 w-full overflow-visible text-left lg:ml-6">
                  <CardContent className="flex min-h-0 flex-col">
                    <div className="space-y-0">
                      {isPricingLoading ? (
                        <Skeleton className="h-7 w-52 rounded-sm" />
                      ) : (
                        <span className="text-lg font-medium text-primary">
                          {t("gymDetails.price.startsFromLabel", {
                            defaultValue: "Starts from",
                          })}{" "}
                          {primaryPlan
                            ? formatCurrency(
                                primaryPlan.userPrice,
                                gym.currencyCode,
                              )
                            : t("gymDetails.price.unavailable", {
                                defaultValue: "Pricing unavailable",
                              })}
                        </span>
                      )}

                      {isPricingLoading ? (
                        <Skeleton className="mt-1 h-4 w-36 rounded-sm" />
                      ) : (
                        <p className="text-md text-muted-foreground">
                          {pricingPlans.length === 1
                            ? t("gymDetails.price.planCount", {
                                defaultValue: "1 pricing plan available",
                              })
                            : t("gymDetails.price.plansCount", {
                                count: pricingPlans.length,
                                defaultValue: `${pricingPlans.length} pricing plans available`,
                              })}
                        </p>
                      )}
                    </div>

                    {isPricingLoading ? (
                      <div className="space-y-4 pt-1">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Separator className="my-0" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                      </div>
                    ) : sortedPricingPlans.length > 0 ? (
                      <>
                        <FeedScrollablePanel
                          showDesktopShadows
                          className="pt-1 py-4 px-1"
                          topShadowClassName="from-card via-card to-transparent"
                          bottomShadowClassName="from-card via-card to-transparent"
                        >
                          <div className="space-y-4">
                            {sortedPricingPlans.map((plan, index) => (
                              <div
                                key={plan.pricingPlanId}
                                className="space-y-4"
                              >
                                <WebPlanCard
                                  plan={plan}
                                  currencyCode={gym.currencyCode}
                                  isSelected={
                                    selectedPricingPlan?.pricingPlanId ===
                                    plan.pricingPlanId
                                  }
                                  onPress={() =>
                                    setSelectedPricingPlanId(plan.pricingPlanId)
                                  }
                                />
                                {index < sortedPricingPlans.length - 1 ? (
                                  <Separator className="my-0" />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </FeedScrollablePanel>
                        <Button type="button" disabled className="w-full">
                          <WebAppIcon
                            family="MaterialCommunityIcons"
                            name="cart-variant"
                            size="2xl"
                          />
                          <span>
                            {t("gymDetails.price.purchasePlan", {
                              planName: selectedPricingPlan?.name ?? "",
                              defaultValue: selectedPricingPlan
                                ? `Purchase ${selectedPricingPlan.name}`
                                : "Purchase plan",
                            })}
                          </span>
                        </Button>
                      </>
                    ) : (
                      <p className="text-md text-muted-foreground">
                        {t("bossScreen.gymWizard.step3.noPricingPlans", {
                          defaultValue: "Missing pricing plans.",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          <div className="space-y-5">
            <section
              id={GYM_DETAILS_SECTION_IDS.location}
              className="scroll-mt-28 space-y-4"
            >
              <SectionHeader
                iconName="map-marker-outline"
                title={t("gymDetails.location.label", {
                  defaultValue: "Location",
                })}
                subtitle={t("gymDetails.location.subtitle", {
                  defaultValue:
                    "Preview where the gym is and tap to open the dedicated map.",
                })}
              />
              <GymLocationMapSurface
                latitude={gym.coordinates.latitude}
                longitude={gym.coordinates.longitude}
                gymCategory={gym.gymCategory}
                gymName={gym.gymName}
                isRecommended={false}
                interactive={!isMobileViewport}
                showBottomLabel={false}
                surfaceClassName="w-full"
                mapClassName="h-[36rem] md:h-[40rem]"
                onExpand={() => setIsLocationOverlayOpen(true)}
                onPress={
                  isMobileViewport
                    ? () => setIsLocationOverlayOpen(true)
                    : undefined
                }
              />
            </section>
          </div>

          <Separator className="my-8" />

          <div
            id={GYM_DETAILS_SECTION_IDS.reviews}
            ref={reviewsSectionRef}
            className="scroll-mt-28"
          >
            <div className="w-full py-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsReviewsDialogOpen(true)}
                className="h-auto w-full rounded-2xl p-0 hover:bg-muted/20"
              >
                <div className="flex w-full flex-col items-center justify-center px-4 pt-0">
                  {isReviewsLoading ? (
                    <div className="flex w-full max-w-md flex-col items-center gap-2 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-11 w-11 rounded-sm" />
                        <Skeleton className="h-12 w-24 rounded-sm" />
                      </div>
                      <Skeleton className="h-9 w-72 rounded-sm" />
                      <Skeleton className="h-7 w-56 rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-full max-w-md flex-col items-center justify-center gap-2 py-4 text-center">
                      <div className="flex flex-row items-center justify-center gap-1.5">
                        <WebAppIcon family="Ionicons" name="star" size={42} />
                        <span className="text-[56px] font-medium leading-none text-foreground">
                          {averageRating || 0}
                        </span>
                      </div>
                      <div className="w-full flex-col justify-center">
                        <p className="text-center text-2xl font-semibold text-foreground">
                          {reviewCount < 1
                            ? t("gymDetails.reviews.footerLabelNoReviews")
                            : t("gymDetails.reviews.footerLabel")}
                        </p>
                        <p className="mt-2 text-center text-xl text-muted-foreground">
                          {t("gymDetails.reviews.tapToSeeAllReviews", {
                            count: displayReviewCount,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Button>

              {isReviewsLoading ? (
                <div className="relative px-3 py-3 sm:px-4">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-background via-background/90 to-transparent md:w-16" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-background via-background/90 to-transparent md:w-16" />

                  <div className="no-scrollbar flex items-center gap-5 overflow-x-auto px-5 py-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <WebReviewCard
                        key={`review-skeleton-${index}`}
                        review={{} as never}
                        fallbackLabel=""
                        isLoading
                        className="w-full max-w-[400px] shrink-0 self-center"
                      />
                    ))}
                  </div>
                </div>
              ) : displayReviews.length > 0 ? (
                <div className="relative px-3 py-3 sm:px-4">
                  <div className="hidden items-center gap-2 md:inline-flex">
                    <button
                      type="button"
                      onClick={() => scrollReviewsByCards(-1)}
                      disabled={!canScrollReviewsPrev}
                      aria-label="Scroll reviews left"
                      className="bg-background text-foreground hover:bg-muted absolute top-1/2 left-0 z-10 inline-flex h-8 w-8 -translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border transition-colors disabled:cursor-default disabled:opacity-35"
                    >
                      <WebAppIcon
                        family="Ionicons"
                        name="chevron-back"
                        size="lg"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollReviewsByCards(1)}
                      disabled={!canScrollReviewsNext}
                      aria-label="Scroll reviews right"
                      className="bg-background text-foreground hover:bg-muted absolute top-1/2 right-0 z-10 inline-flex h-8 w-8 translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border transition-colors disabled:cursor-default disabled:opacity-35"
                    >
                      <WebAppIcon
                        family="Ionicons"
                        name="chevron-forward"
                        size="lg"
                      />
                    </button>
                  </div>

                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-background via-background/90 to-transparent transition-opacity duration-200 md:w-16",
                      canScrollReviewsPrev ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-background via-background/90 to-transparent transition-opacity duration-200 md:w-16",
                      canScrollReviewsNext ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div
                    ref={reviewsRowRef}
                    className={cn(
                      "no-scrollbar flex items-center gap-5 overflow-x-auto px-5 py-4",
                      !reviewsOverflowing && "justify-center",
                    )}
                  >
                    {displayReviews.map((review) => (
                      <WebReviewCard
                        key={`${review.uid}-${review.createdAt?.toString?.() ?? review.comment}`}
                        review={review}
                        fallbackLabel={t("gymDetails.reviews.anonymous", {
                          defaultValue: "Anonymous member",
                        })}
                        className="w-full max-w-[400px] shrink-0 self-center"
                        onPress={() => setIsReviewsDialogOpen(true)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-lg font-medium text-foreground">
                    {t("gymDetails.reviews.noReviews")}
                  </p>
                  <p className="mt-1 text-md text-muted-foreground">
                    {t("gymDetails.reviews.maybeYou")}
                  </p>
                </div>
              )}
            </div>

            <WebGymReviewsDialog
              gymName={gym.gymName}
              reviews={displayReviews}
              reviewCount={displayReviewCount}
              averageRating={averageRating}
              isLoading={isReviewsLoading}
              open={isReviewsDialogOpen}
              onOpenChange={setIsReviewsDialogOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WebAppIcon, type WebAppIconName } from "@/components/WebAppIcon";
import WebGymCard from "@/components/gyms/WebGymCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { buildGymDetailsUrl } from "@/lib/gymUrls";
import { primeGymDetailsRoute } from "@/lib/primeGymDetailsRoute";
import { cn } from "@/lib/utils";
import type { GymCardProps, GymCategory } from "@/types/backendTypes";
import type { DistanceUnit } from "./types";

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export function HorizontalGymRow({
  category,
  title,
  gyms,
  iconName,
  cardVariant = "normal",
  showChevron = false,
  isLoading = false,
  showSeeMoreCta = false,
  showBottomDivider = false,
  seeMoreVisible,
  seeMorePreviewGyms,
  distanceUnit,
  savedGymIdSet,
  onToggleSavedGym,
  resetScrollOnItemsChange = false,
}: {
  category?: GymCategory;
  title: string;
  gyms: GymCardProps[];
  iconName?: WebAppIconName<"MaterialCommunityIcons">;
  cardVariant?: "normal" | "compact";
  showChevron?: boolean;
  isLoading?: boolean;
  showSeeMoreCta?: boolean;
  showBottomDivider?: boolean;
  seeMoreVisible?: boolean;
  seeMorePreviewGyms?: GymCardProps[];
  distanceUnit?: DistanceUnit;
  savedGymIdSet?: Set<string>;
  onToggleSavedGym?: (nextSaved: boolean, gymId?: string) => void;
  resetScrollOnItemsChange?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const rowScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const rowCardWidthClass =
    cardVariant === "compact"
      ? "w-[calc((100%_-_2rem)_/_3)] snap-start shrink-0 sm:w-[calc((100%_-_3rem)_/_4)] md:w-[calc((100%_-_4rem)_/_5)] lg:w-[calc((100%_-_5rem)_/_6)] xl:w-[calc((100%_-_6rem)_/_7)] 2xl:w-[calc((100%_-_7rem)_/_8)]"
      : "w-[calc((100%_-_1rem)_/_2)] snap-start shrink-0 sm:w-[calc((100%_-_2rem)_/_3)] md:w-[calc((100%_-_3rem)_/_4)] lg:w-[calc((100%_-_4rem)_/_5)] xl:w-[calc((100%_-_5rem)_/_6)] 2xl:w-[calc((100%_-_6rem)_/_7)]";
  const cards = isLoading
    ? (Array.from({ length: 6 }, (_, index) => ({
        gymId: `skeleton-${index}`,
        gymName: "",
        isLoading: true,
      })) as GymCardProps[])
    : gyms;
  const previewImageUrls = useMemo(() => {
    if (isLoading) return [];

    const previewGyms = seeMorePreviewGyms ?? gyms;
    const uniqueImageUrls = Array.from(
      new Set(
        previewGyms
          .map((gym) => gym.mainImage)
          .filter(
            (mainImage): mainImage is string =>
              typeof mainImage === "string" && mainImage.length > 0,
          ),
      ),
    );

    const seed = `${title}-${uniqueImageUrls.length}-${uniqueImageUrls.join("|")}`;
    return uniqueImageUrls
      .map((url) => ({ url, score: hashString(`${seed}-${url}`) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((entry) => entry.url);
  }, [gyms, isLoading, seeMorePreviewGyms, title]);
  const previewCollageSlots = useMemo(
    () => [previewImageUrls[0], previewImageUrls[1], previewImageUrls[2]],
    [previewImageUrls],
  );
  const shouldRenderSeeMoreCta =
    showSeeMoreCta &&
    !isLoading &&
    (typeof seeMoreVisible === "boolean" ? seeMoreVisible : gyms.length >= 8);
  const isCompact = cardVariant === "compact";
  const cardsSignature = useMemo(
    () =>
      cards
        .map((gym, index) => gym.gymId ?? gym.gymName ?? `card-${index}`)
        .join("|"),
    [cards],
  );

  const updateScrollControls = useCallback(() => {
    const element = rowScrollRef.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCanScrollPrev(element.scrollLeft > 4);
    setCanScrollNext(element.scrollLeft < maxScrollLeft - 4);
  }, []);

  const scrollByCards = useCallback((direction: -1 | 1) => {
    const element = rowScrollRef.current;
    if (!element) return;

    const scrollDelta = Math.max(220, Math.floor(element.clientWidth * 0.85));
    element.scrollBy({
      left: direction * scrollDelta,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const element = rowScrollRef.current;
    if (!element) return;

    const onScroll = () => updateScrollControls();
    element.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollControls());
    resizeObserver.observe(element);

    updateScrollControls();

    return () => {
      element.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollControls]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => updateScrollControls());
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [cards.length, updateScrollControls]);

  useEffect(() => {
    if (!resetScrollOnItemsChange) return;

    const element = rowScrollRef.current;
    if (!element) return;

    const frameId = window.requestAnimationFrame(() => {
      element.scrollTo({ left: 0, behavior: "auto" });
      updateScrollControls();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [cardsSignature, resetScrollOnItemsChange, updateScrollControls]);

  if (!isLoading && cards.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="inline-flex items-center gap-1.5 sm:gap-2">
          {category === "performance" ? (
            <WebAppIcon
              family="Feather"
              name="crosshair"
              className="shrink-0 text-foreground transition-transform min-[1600px]:scale-[1.3] mx-1"
              size="xl"
            />
          ) : iconName ? (
            <WebAppIcon
              family="MaterialCommunityIcons"
              name={iconName}
              size="lg"
              className="shrink-0 text-foreground transition-transform min-[1600px]:scale-[1.3] mx-1"
            />
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight min-[1600px]:text-xl">
            {title}
          </h2>
          {showChevron && (
            <WebAppIcon
              family="Ionicons"
              name="chevron-forward"
              className="text-foreground transition-transform min-[1600px]:scale-[1.3]"
              size="lg"
            />
          )}
        </div>
        <div className="hidden items-center gap-2 md:inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scrollByCards(-1)}
            disabled={!canScrollPrev}
            aria-label="Scroll left"
            className="h-8 w-8 rounded-full border border-border shadow-none"
          >
            <WebAppIcon family="Ionicons" name="chevron-back" size="lg" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scrollByCards(1)}
            disabled={!canScrollNext}
            aria-label="Scroll right"
            className="h-8 w-8 rounded-full border border-border shadow-none"
          >
            <WebAppIcon family="Ionicons" name="chevron-forward" size="lg" />
          </Button>
        </div>
      </div>
      <div
        ref={rowScrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 scroll-px-4 sm:px-0 sm:scroll-px-0"
      >
        {cards.map((gym, index) => {
          const gymId = gym.gymId ?? "";
          const gymName = gym.gymName ?? "Gym";
          const href = gymId ? buildGymDetailsUrl({ gymId, gymName }) : "#";
          const key = `${title}-${gymId || `skeleton-${index}`}-${gymName}`;

          if (isLoading) {
            return (
              <div key={key} className={rowCardWidthClass}>
                <WebGymCard
                  {...gym}
                  isLoading
                  variant={cardVariant}
                  className="max-w-none"
                  distanceUnit={distanceUnit}
                />
              </div>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              className={rowCardWidthClass}
              onClick={() => {
                primeGymDetailsRoute(queryClient, gym);
              }}
            >
              <WebGymCard
                {...gym}
                variant={cardVariant}
                className="max-w-none"
                distanceUnit={distanceUnit}
                isSaved={Boolean(gymId && savedGymIdSet?.has(gymId))}
                onToggleSaved={onToggleSavedGym}
              />
            </Link>
          );
        })}
        {shouldRenderSeeMoreCta ? (
          <button
            type="button"
            onClick={() => {}}
            className={cn(
              rowCardWidthClass,
              "group relative isolate self-start text-left",
            )}
            aria-label={t("favouritesScreen.recentlyViewed.seeMore", {
              defaultValue: "See more",
            })}
          >
            <div className="relative aspect-[1.35/1] overflow-hidden">
              <div className="flex h-full w-full flex-col items-center justify-center">
                <div
                  className={cn(
                    "relative",
                    isCompact
                      ? "h-[3.25rem] w-[4.55rem] sm:h-[3.8rem] sm:w-[5.3rem] md:h-[4rem] md:w-[5.6rem] lg:h-[4.45rem] lg:w-[6.2rem]"
                      : "h-[4.2rem] w-[6rem] sm:h-[4.9rem] sm:w-[7rem] md:h-[5.45rem] md:w-[7.7rem] lg:h-[6.1rem] lg:w-[8.7rem] xl:h-[6.8rem] xl:w-[9.6rem]",
                  )}
                >
                  {previewCollageSlots.map((imageUrl, index) => {
                    const layerClassNames = isCompact
                      ? [
                          "left-1/2 top-0 z-[1] -translate-x-1/2 -rotate-6",
                          "left-1 top-3 z-[2] -rotate-[12deg] sm:left-1.5 sm:top-4",
                          "right-1 top-3 z-[2] rotate-[11deg] sm:right-1.5 sm:top-4",
                        ]
                      : [
                          "left-1/2 top-1 z-[1] -translate-x-1/2 -rotate-6 sm:top-1.5",
                          "left-1.5 top-5.5 z-[2] -rotate-[12deg] sm:left-2 sm:top-6.5 md:top-7",
                          "right-1.5 top-5.5 z-[2] rotate-[11deg] sm:right-2 sm:top-6.5 md:top-7",
                        ];

                    return (
                      <div
                        key={`preview-collage-${title}-${index}`}
                        className={cn(
                          isCompact
                            ? "absolute h-[1.45rem] w-[2.1rem] rounded-md border-2 border-background bg-muted bg-cover bg-center shadow-[0_10px_20px_-10px_rgba(2,6,23,0.45)] dark:shadow-[0_14px_24px_-12px_rgba(0,0,0,0.72)] sm:h-[1.72rem] sm:w-[2.45rem] md:h-[1.86rem] md:w-[2.65rem] lg:h-[2.05rem] lg:w-[2.9rem]"
                            : "absolute h-[2.2rem] w-[3.1rem] rounded-lg border-[2.5px] border-background bg-muted bg-cover bg-center shadow-[0_14px_26px_-10px_rgba(2,6,23,0.45)] dark:shadow-[0_18px_30px_-12px_rgba(0,0,0,0.72)] sm:h-[2.55rem] sm:w-[3.65rem] md:h-[2.9rem] md:w-[4.15rem] lg:h-[3.3rem] lg:w-[4.7rem] xl:h-[3.7rem] xl:w-[5.3rem]",
                          layerClassNames[index] ?? layerClassNames[0],
                        )}
                        style={
                          imageUrl
                            ? { backgroundImage: `url(${imageUrl})` }
                            : undefined
                        }
                      >
                        {!imageUrl ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <WebAppIcon
                              family="Ionicons"
                              name="add-circle-outline"
                              className={cn(
                                "text-foreground",
                                isCompact
                                  ? "size-3.5 sm:size-4"
                                  : "size-4 sm:size-5",
                              )}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-col items-center justify-center sm:mt-2.5">
                  <WebAppIcon
                    family="Ionicons"
                    name="add-circle-outline"
                    className={cn(
                      "mb-1 text-foreground",
                      isCompact
                        ? "size-4 sm:size-5 md:size-5 lg:size-6"
                        : "size-5 sm:size-6 md:size-6 lg:size-7 xl:size-8",
                    )}
                  />
                  <span
                    className={cn(
                      "text-center font-semibold leading-tight text-foreground/90",
                      isCompact
                        ? "text-[11px] sm:text-xs md:text-sm lg:text-md"
                        : "text-sm md:text-md lg:text-lg",
                    )}
                  >
                    {t("favouritesScreen.recentlyViewed.seeMore", {
                      defaultValue: "See more",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ) : null}
      </div>
      {showBottomDivider ? (
        <Separator className="mx-auto my-4 sm:my-8 w-4/5" />
      ) : null}
    </section>
  );
}

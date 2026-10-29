import { Container, clx } from "@modules/common/components/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  /** Cross-fade to the second product image on hover (product grids). */
  hoverImage?: boolean
  className?: string
  alt?: string
  "data-testid"?: string
}

const imageSizes =
  "(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  hoverImage,
  className,
  alt = "",
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url
  const secondImage = hoverImage
    ? images?.map((i) => i.url).find((url) => url && url !== initialImage)
    : undefined

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden isolate p-0 bg-white",
        className,
        {
          "rounded-image": size !== "small",
          "rounded-[6px]": size === "small",
          "aspect-[4/5]": isFeatured,
          "aspect-square": !isFeatured,
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full" || size === "square",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} alt={alt} />
      {secondImage && (
        <Image
          src={secondImage}
          alt=""
          aria-hidden
          className="absolute inset-0 object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          draggable={false}
          quality={60}
          sizes={imageSizes}
          fill
        />
      )}
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  alt,
}: Pick<ThumbnailProps, "size" | "alt"> & { image?: string }) => {
  return image ? (
    <Image
      src={image}
      alt={alt ?? ""}
      className="absolute inset-0 object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
      draggable={false}
      quality={60}
      sizes={imageSizes}
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-mist">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail

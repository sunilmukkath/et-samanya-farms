import Image from "next/image";

type FarmPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

export function FarmPhoto({
  src,
  alt,
  className = "",
  priority,
  sizes,
  width = 1024,
  height = 420,
}: FarmPhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      priority={priority}
      sizes={sizes ?? "(min-width: 768px) 50vw, 100vw"}
    />
  );
}

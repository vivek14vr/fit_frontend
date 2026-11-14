import Image from "next/image";

export default function Loading() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="entry-loader__content">
        <div className="entry-loader__flower" aria-hidden="true">
          <span className="entry-loader__halo" />
          <Image
            className="entry-loader__logo"
            src="/deepa-chakra-small.svg"
            alt=""
            width={200}
            height={200}
            priority
          />
        </div>
        <p className="entry-loader__brand">DEEPTI SHERAWAT</p>
        <p className="entry-loader__descriptor">Nutritionist · Ayurveda · Modern science</p>
        <span className="entry-loader__sr-only">Loading the next page</span>
      </div>
    </div>
  );
}

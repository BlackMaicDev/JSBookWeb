import Image from "next/image";

export default function FamilyLogo() {
  return <>
    <Image src="/family-js-mark.svg" alt="" width={44} height={44} className="family-logo-mark" />
    <span className="family-logo-wordmark"><span>Family <strong>JS</strong></span><small>STORIES · BOOKS · LIFE</small></span>
  </>;
}

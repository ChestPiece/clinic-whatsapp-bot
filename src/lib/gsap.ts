"use client";

// One place registers GSAP plugins. Import gsap and friends from here, never from "gsap" directly.
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip, SplitText);
gsap.defaults({ ease: "power3.out", duration: 0.5 });

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };

import React from "react";
import Hero from "../components/Home/Hero";
import Pricing from "../components/Home/Pricing";
import { useDictationCapture } from "../hooks/useDictationCapture";

interface HomeProps {
  mode: "light" | "dark";
}

const Home: React.FC<HomeProps> = ({ mode }) => {
  useDictationCapture();

  return (
    <>
      <Hero mode={mode} />
      <Pricing />
    </>
  );
};

export default Home;
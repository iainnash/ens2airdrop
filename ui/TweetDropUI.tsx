import { useState } from "react";
import "degen/dist/style.css";
import { ThemeProvider, Text, Heading } from "degen";
import { ConfigPage } from "./ConfigPage";
import { UserConfig } from "./types";
import { ScraperInterface } from "./ScraperInterface";

const Content = () => {
  const [userConfig, setUserConfig] = useState<UserConfig | undefined>();

  if (!userConfig) {
    return <ConfigPage nextStepAction={setUserConfig} />;
  }

  return (
    <>
      <ScraperInterface userConfig={userConfig} />
    </>
  );
};

export const TweetDropUI = () => {
  return (
    <ThemeProvider>
      <Heading>Drop your Ens to Airdrop pipeline</Heading>
      <Text>
        <br />
        This is a web ui (
        <a href="https://github.com/iainnash/ens2airdrop" target="_blank">
          github.com/iainnash/ens2airdrop
        </a>
        ) to download all tweets from a <em>drop your ens</em> thread and parse
        out both validish eth addresses and resolve ens addresses within.
      </Text>
      <br />
      <Content />
    </ThemeProvider>
  );
};

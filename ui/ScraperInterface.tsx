import { useMemo, useState, useCallback, useEffect } from "react";
import { Button, FieldSet, Input, Text, Textarea } from "degen";
import Scraper from "../scraper/scraper";
import { chunk } from "./array-utils";

import { UserConfig } from "./types";

export const ScraperInterface = ({
  userConfig,
}: {
  userConfig: UserConfig;
}) => {
  const [numberScrapedTweets, setNumberScrapedTweets] = useState(0);
  const [status, setStatus] = useState("pending");
  const [numberOfTokens, setNumberOfTokens] = useState(0);

  const [etherscanChunkSize, setEtherscanChunkSize] = useState(100);

  const [logs, setLogs] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const cleanedAddresses = useMemo(
    () => [...new Set(addresses.map((a) => a.addr))],
    [addresses]
  );
  const addressChunks = useMemo(
    () => chunk(cleanedAddresses, etherscanChunkSize),
    [cleanedAddresses, etherscanChunkSize]
  );

  const scraper = useMemo(() => {
    const scraper = new Scraper(
      userConfig.twitterConversationId,
      userConfig.twitterBearer,
      10,
      userConfig.ensRpcUrl
    );
    scraper.logger.listener = (logs) => {
      setLogs(logs);
    };
    return scraper;
  });

  useEffect(() => {
    const i = setInterval(() => {
      console.log('setting');
      setLogs(scraper.logger.logs);
    }, 1000);
    return () => {
      clearInterval(i);
    };
  }, [setLogs]);

  const run = useCallback(() => {
    console.log("attempting scrape");
    setStatus("scraping");
    (async () => {
      const addresses = await scraper.scrape();
      setAddresses(addresses);
      setStatus("done");
    })();
  });

  return (
    <>
      <Button onClick={run}>Run scrape</Button>

      <FieldSet legend="Commandline">
        <Textarea
          description="Fetch history updates"
          value={logs.map(([_, log]: any) => log).join("\n")}
          readonly
        />

        <Input
          value={numberOfTokens.toString()}
          type="number"
          onChange={(e) => {
            setNumberOfTokens(parseInt(e.target.value, 10));
          }}
          label="Number of tokens (erc20 disperse.app) (set to 0 to omit)"
        />
        <Textarea
          label="Collected Addresses"
          placeholder="Collecting..."
          readonly
          rows={30}
          value={cleanedAddresses
            .map((addr) => (numberOfTokens ? `addr,${numberOfTokens}` : addr))
            .join("\n")}
        />

        {/* chunk into 200 cleanedAddresses */}
        <Input
          value={etherscanChunkSize.toString()}
          type="number"
          onChange={(e) => {
            setEtherscanChunkSize(parseInt(e.target.value, 10));
          }}
          label="Etherscan chunk size"
        />
        <Textarea
          label="Etherscan format"
          placeholder="Collecting..."
          readonly
          rows={addressChunks.length * 2}
          value={addressChunks.map((addressesChunk) => {
            return `[${addressesChunk.join(',')}]`;
          }).join('\n')}
        />
      </FieldSet>
    </>
  );
};

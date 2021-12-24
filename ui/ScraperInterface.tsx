import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Button, FieldSet, Input, Textarea } from "degen";
import Scraper from "../scraper/scraper";
import { chunk } from "./array-utils";
import { getAddress } from "@ethersproject/address";

import { UserConfig } from "./types";

export const ScraperInterface = ({
  userConfig,
}: {
  userConfig: UserConfig;
}) => {
  const [status, setStatus] = useState("pending");
  const [numberOfTokens, setNumberOfTokens] = useState(0);

  const [etherscanChunkSize, setEtherscanChunkSize] = useState(100);

  const logViewer = useRef();

  const [logs, setLogs] = useState<any>([]);
  const [addresses, setAddresses] = useState([]);
  const cleanedAddresses = useMemo(
    () => [...new Set(addresses.map((a) => getAddress(a.addr)))],
    [addresses]
  );
  const addressChunks = useMemo(
    () => chunk(cleanedAddresses, etherscanChunkSize),
    [cleanedAddresses, etherscanChunkSize]
  );

  const scraper = useMemo(
    () =>
      new Scraper(
        userConfig.twitterConversationId,
        userConfig.twitterBearer,
        10,
        userConfig.ensRpcUrl
      )
  );

  useEffect(() => {
    if (scraper) {
      scraper.logger.listener = (logs) => {
        if (!logViewer.current) {
          return;
        }
        logViewer.current.value = logs.map(([_, log]: any) => log).join("\n");
        logViewer.current.scrollTop = logViewer.current.scrollHeight;
      };
    }
  }, [logViewer.current, scraper]);

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
      <Button onClick={run} disabled={status === "scraping"}>
        Run scrape
      </Button>
      <br />
      <br />

      <FieldSet legend="Fetch ENS">
        <Textarea label="Action log" readonly ref={logViewer} />
        {/* chunk into 200 cleanedAddresses */}
        <Input
          value={etherscanChunkSize.toString()}
          type="number"
          onChange={(e) => {
            setEtherscanChunkSize(parseInt(e.target.value, 10));
          }}
          label="Address chunk size"
          description="Number of addresses to add in each chunk"
        />
      </FieldSet>
      <br />
      <br />
      <FieldSet legend="Results for disperse.app">
        <Input
          value={numberOfTokens.toString()}
          type="number"
          onChange={(e) => {
            setNumberOfTokens(parseInt(e.target.value, 10));
          }}
          label="Number of tokens (erc20 disperse.app) (set to 0 to omit)"
        />
        {/* chunk viewer */}
        {chunk(cleanedAddresses, etherscanChunkSize).map((chunk, chunkId) => (
          <Textarea
            label={`Collected Addresses Chunk #${chunkId + 1}`}
            placeholder="Collecting..."
            key={chunkId}
            readonly
            rows={28}
            value={chunk
              .map((addr) =>
                numberOfTokens ? `${addr},${numberOfTokens}` : addr
              )
              .join("\n")}
          />
        ))}
      </FieldSet>
      <br />
      <br />
      <FieldSet legend="Results for etherscan array">
        {addressChunks.map((chunk, indx) => (
          <Textarea
            key={indx}
            label={`Etherscan format chunk #${indx + 1}`}
            placeholder="Collecting..."
            readonly
            rows={4}
            value={`[${chunk.join(",")}]`}
          />
        ))}
      </FieldSet>
    </>
  );
};

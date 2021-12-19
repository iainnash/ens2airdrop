import { isAddress } from "@ethersproject/address";
import { providers } from "ethers"; // RPC for ENS names

// Regex matches for addresses and ENS names
const addressRegex: RegExp = /(0x[a-zA-Z0-9])\w+/;
const ENSRegex: RegExp = /([a-zA-Z0-9]\w+.(eth))/i;
type AddressInfo = { addr: string; tweet: string; ens?: string };

class Logger {
  logs: [string, string][] = [];
  listener: any;
  info(info: string) {
    console.info(info);
    this.logs.push(["info", info]);
    if (this.listener) {
      this.listener(this.logs);
    }
  }
  error(error: string) {
    console.error(error);
    this.logs.push(["error", error]);
    if (this.listener) {
      this.listener(this.logs);
    }
  }
}

export default class Scraper {
  // Optional RPC to resolve ENS names to addresses
  rpc?: providers.JsonRpcProvider | null;
  // Tweet conversation ID
  conversationID: string;
  // Twitter token
  twitterBearer: string;
  // Number of tokens to distribute per address
  numTokens: number;

  logger: Logger;

  // Collected tweets from Twitter API
  tweets: { id: string; text: string }[] = [];
  // Cleaned addresses from tweets
  addresses: AddressInfo[] = [];

  /**
   * Setup scraper
   * @param {string} conversationID to scrape
   * @param {string} twitterBearer 2.0 token
   * @param {number} numTokens to distribute per address
   * @param {string?} rpcProvider optional rpc endpoint to convert ENS names
   */
  constructor(
    conversationID: string,
    twitterBearer: string,
    numTokens: number,
    rpcProvider?: string
  ) {
    this.conversationID = conversationID;
    this.twitterBearer = twitterBearer;
    this.numTokens = numTokens;

    if (rpcProvider) {
      this.rpc = new providers.StaticJsonRpcProvider(rpcProvider);
    }
    this.logger = new Logger();
  }

  /**
   * Generates endpoint to query for tweets from a thread
   * @param {string?} nextToken if paginating tweets
   * @returns {string} endpoint url
   */
  generateEndpoint(nextToken?: string): string {
    const baseEndpoint: string =
      "https://dark-resonance.isiain.workers.dev/2/tweets/search/recent?query=conversation_id:" +
      // Append conversation ID
      this.conversationID +
      // Collect max allowed results
      "&max_results=100";

    // If paginating, append next_token to endpoint
    return nextToken ? `${baseEndpoint}&next_token=${nextToken}` : baseEndpoint;
  }

  /**
   * Recursively collect tweets from a thread (max. 100 per run)
   * @param {string?} nextSearchToken optional pagination token
   */
  async collectTweets(nextSearchToken?: string): Promise<void> {
    // Collect tweets
    const resp = await fetch(await this.generateEndpoint(nextSearchToken), {
      headers: {
        Authorization: `Bearer ${this.twitterBearer}`,
      },
    });
    const data = await resp.json();

    // Append new tweets
    const tweets: Record<string, string>[] = data.data;
    this.tweets.push(...data.data);
    this.logger.info(`Collected ${tweets.length} tweets`);

    const nextToken: string | undefined = data.meta.next_token;
    // If pagination token exists:
    if (nextToken) {
      // Collect next page of tweets
      await this.collectTweets(nextToken);
    }
  }

  /**
   * Cleans individual tweets, filtering for addresses
   */
  cleanTweetsForAddresses(): void {
    for (const tweet of this.tweets) {
      // Remove line-breaks, etc.
      const cleanedText: string = tweet.text.replace(/(\r\n|\n|\r)/gm, "");

      const foundAddress: RegExpMatchArray | null =
        cleanedText.match(addressRegex);
      const foundENS: RegExpMatchArray | null = cleanedText.match(ENSRegex);

      for (const foundArrs of [foundAddress, foundENS]) {
        // If match in tweet
        if (foundArrs && foundArrs.length > 0) {
          // If type(address)
          const addr: string = foundArrs[0].startsWith("0x")
            ? // Quick cleaning to only grab first 42 characters
              foundArrs[0].substring(0, 42)
            : foundArrs[0];

          // Push address or ENS name
          this.addresses.push({ addr, tweet: tweet.text });
        }
      }
    }
  }

  /**
   * Convert ENS names to addresses
   */
  async convertENS(): Promise<void> {
    let convertedAddresses: { addr: string; ens?: string; tweet: string }[] =
      [];

    for (let i = 0; i < this.addresses.length; i++) {
      // Force lowercase (to avoid .ETH, .eth, .eTh matching)
      const address = this.addresses[i].addr.toLowerCase();
      const addressData = this.addresses[i];

      // If ENS name
      if (address.includes(".eth")) {
        // Resolve name via RPC
        let parsed: string | undefined = await this.rpc?.resolveName(address);
        if (!parsed && address.startsWith("0x")) {
          // remove 0x prefix to see if name resolves
          parsed = await this.rpc?.resolveName(address.substr(2));
        }
        if (parsed) {
          this.logger.info(`found ens for ${address} as ${parsed}`);
          // If successful resolve, push name
          convertedAddresses.push({
            addr: parsed,
            ens: addressData.addr,
            tweet: addressData.tweet,
          });
        } else {
          this.logger.info(`could not find ens for ${address}`);
        }
      } else if (isAddress(address)) {
        this.logger.info(`adding address ${address}`);
        convertedAddresses.push({
          addr: addressData.addr,
          tweet: addressData.tweet,
        });
      } else {
        this.logger.info(`invalid address entry ${address}`);
      }
    }

    this.addresses = convertedAddresses;
  }

  /**
   * Scrape tweets, find addresses, output batch copyable disperse files
   */
  async scrape(scrapedStrings: (addrs: AddressInfo[]) => void = () => {}) {
    // Collect all tweets from thread
    await this.collectTweets();
    this.logger.info(`Collected ${this.tweets.length} total tweets`);

    // Clean tweets, finding addresses and ENS names
    await this.cleanTweetsForAddresses();
    this.logger.info(
      `Collected ${this.addresses.length} addresses from tweets`
    );

    scrapedStrings(this.addresses);

    // If RPC provided
    if (this.rpc) {
      // Resolve ENS names to addresses
      await this.convertENS();
      this.logger.info("Converted ENS names to addresses");
    }

    // Output addresses to filesystem
    // await this.outputAddresses();
    // console.info("Outputted addresses in 100-address batches to /output");
    return this.addresses;
  }
}

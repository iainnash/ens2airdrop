import { Button, FieldSet, Input, Text } from "degen";
import { useCallback, useState } from "react";
import { UserConfig } from "./types";

type ConfigPageProps = {
  nextStepAction: (config: UserConfig) => void;
};

export const ConfigPage = ({ nextStepAction }: ConfigPageProps) => {
  const [twitterBearer, setTwitterBearer] = useState("");
  const [ensRpcUrl, setEnsRpcUrl] = useState("https://cloudflare-eth.com/");
  const [twitterConversationId, setTwitterConversationId] = useState("");

  const nextStep = useCallback(() => {
    nextStepAction({ twitterBearer, ensRpcUrl, twitterConversationId });
  });

  return (
    <FieldSet legend="Configuration">
      <Input
        required={true}
        label="Twitter Bearer token"
        placeholder="AAAAAAAAAAAAAAAAAAAAAG4LTgEA..."
        onChange={(e) => setTwitterBearer(e.target.value)}
        value={twitterBearer}
      />

      <Text style={{ marginLeft: 8 }}>
        Make an app at{" "}
        <a href="https://developer.twitter.com/">developer.twitter.com</a> and
        generate the <code>Bearer token</code> to paste here.
      </Text>

      <Input
        required={true}
        label="RPC URL for ENS resolution"
        onChange={(e) => setEnsRpcUrl(e.target.value)}
        value={ensRpcUrl}
        description="This is an ETH RPC url for fetching ENS. For large batches, a custom provider url may need to be provided instead of the cloudflare default"
      />
      <Input
        label="Twitter conversation ID"
        required={true}
        onChange={(e) => setTwitterConversationId(e.target.value)}
        value={twitterConversationId}
        description="This is the number at the end of the twitter thread URL (https://twitter.com/isiain/status/XXXXXXXX)"
      />
      <Button onClick={nextStep}>Start collecting addresses</Button>
    </FieldSet>
  );
};
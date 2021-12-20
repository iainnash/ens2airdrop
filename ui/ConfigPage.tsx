import { Button, FieldSet, Input, Text } from "degen";
import { useCallback, useState } from "react";
import { UserConfig } from "./types";

type ConfigPageProps = {
  nextStepAction: (config: UserConfig) => void;
};

export const ConfigPage = ({ nextStepAction }: ConfigPageProps) => {
  const [twitterBearer, setTwitterBearer] = useState("");
  const [twitterConversationId, setTwitterConversationId] = useState("");
  const [threadError, setThreadError] = useState(undefined);

  const nextStep = useCallback(() => {
    if (!twitterConversationId) {
      setThreadError("missing required twitter conversation id");
      return;
    }
    if (!twitterConversationId.match(/[0-9]+$/)) {
      setThreadError("twitter conversation link invalid");
      return;
    }
    nextStepAction({ twitterBearer, twitterConversationId: twitterConversationId.match(/([0-9]+$)/)[0] });
  });

  return (
    <FieldSet legend="Configuration">
      <Input
        label="Twitter Bearer token"
        placeholder="Use default twitter keys"
        onChange={(e) => setTwitterBearer(e.target.value)}
        value={twitterBearer}
      />

      <Text style={{ marginLeft: 8 }}>
        This is strongly recommended for tweet replies over 1000 replies for
        reliability or if there are issues with the default token, can add a
        custom one here.
        <br />
        Make an app at{" "}
        <a href="https://developer.twitter.com/">developer.twitter.com</a> and
        generate the <code>Bearer token</code> to paste here.
      </Text>

      <Input
        label="Twitter conversation link"
        required={true}
        onChange={(e) => setTwitterConversationId(e.target.value)}
        placeholder="https://twitter.com/isiain/status/1472470573427089411"
        value={twitterConversationId}
        description="This is the link to the tweet to load ens replies from"
        error={threadError}
      />
      <Button onClick={nextStep}>Start collecting addresses</Button>
    </FieldSet>
  );
};

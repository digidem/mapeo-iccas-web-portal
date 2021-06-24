import React from "react";
import {
  Card,
  makeStyles,
  CardContent,
  LinearProgress,
  Typography,
} from "@material-ui/core";
import { defineMessages, useIntl } from "react-intl";
import BalanceText from "react-balance-text";
import clsx from "clsx";

const msgs = defineMessages({
  error: {
    id: "upload_error_title",
    defaultMessage: "Upload Error",
  },
  errorDesc: {
    id: "upload_error_desc",
    defaultMessage:
      "There was a problem uploading your map. Click the retry button to try again.",
  },
  uploading: {
    id: "file_uploading",
    defaultMessage: "Uploading file {currentFile} of {totalFiles}",
  },
});

export default function UploadProgress({ id, state, error }) {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  return (
    <Card className={classes.root}>
      <CardContent>
        <div className={clsx(classes.infoArea, error && classes.error)}>
          <div className={classes.text}>
            {state === "error" && (
              <>
                <Typography
                  variant="h5"
                  gutterBottom={!!error}
                  className={clsx(error && classes.errorTitle)}
                >
                  {!!error && formatMessage(msgs.error)}
                </Typography>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  component={BalanceText}
                  variant={error ? "body2" : "body1"}
                >
                  {formatMessage(msgs.errorDesc)}
                </Typography>
              </>
            )}
          </div>
        </div>
        <LinearProgress
          variant={state === "loading" ? "indeterminate" : "determinate"}
          value={state === "done" ? 1 : undefined}
          className={classes.progress}
        ></LinearProgress>
      </CardContent>
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 12,
  },
  infoArea: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  text: {
    maxWidth: "80%",
  },
  errorTitle: {
    fontWeight: 700,
  },
  progress: {
    height: 7,
  },
  error: {
    color: "red",
    marginBottom: theme.spacing(2),
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
  },
}));

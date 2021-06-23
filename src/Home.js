import React, { useCallback, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { useDropzone } from "react-dropzone";
import Fab from "@material-ui/core/Fab";
import Zoom from "@material-ui/core/Zoom";
import AddIcon from "@material-ui/icons/Add";
import Grow from "@material-ui/core/Grow";
import JSZip from "jszip";
import path from "path";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import firebase from "firebase/app";
import BalanceText from "react-balance-text";
import { TransitionGroup } from "react-transition-group";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { defineMessages, useIntl } from "react-intl";

import IccaItem from "./MapItem";
import LoadingScreen from "./LoadingScreen";
import useCreateBoundary from "./hooks/useCreateBoundary";
import Typography from "@material-ui/core/Typography";
import UploadProgress from "./UploadProgress";
import EditDialog from "./EditDialog";

const msgs = defineMessages({
  empty: {
    id: "empty_state",
    defaultMessage:
      'Click "ADD ICCA" to share your ICCA exported from Mapeo with the WCMC',
  },
  confirmDeleteTitle: {
    id: "confirm_delete_title",
    defaultMessage: "Delete this ICCA boundary?",
  },
  confirmDeleteDesc: {
    id: "confirm_delete_desc",
    defaultMessage:
      "If you delete this ICCA boundary, the WCMC will no longer be able to access this data online. The boundary in your local copy of Mapeo will not be deleted",
  },
  addMap: {
    id: "add_map_button",
    defaultMessage: "Add ICCA",
  },
  confirmCancel: {
    id: "confirm_cancel",
    defaultMessage: "No, Cancel",
  },
  confirmConfirm: {
    id: "confirm_confirm",
    defaultMessage: "Yes",
  },
});

// Unzips a File and returns an array of objects containing the file data (as a
// string), filename, date. Note: the original implementation from mapeo-webmaps
// needed arraybuffers for images, for icca packages all files are text (only
// json and geojson) so we drop any files in the zip that don't match the extension
async function unzip(zipfile) {
  const zip = await new JSZip().loadAsync(zipfile);
  const filePromises = [];
  zip.forEach((filepath, file) => {
    const filename = path.basename(filepath);
    // Ignore folders, dot files and __MACOSX files and other strange files we don't need
    if (file.dir || filepath.startsWith("__") || filename.startsWith("."))
      return;
    // Ignore files that are not .json or .geojson
    if (
      path.extname(filepath) !== ".json" &&
      path.extname(filepath) !== ".geojson"
    )
      return;
    const type = "string";
    filePromises.push(
      file.async(type).then((data) => ({
        type,
        data,
        name: file.name,
        date: file.date,
      }))
    );
  });
  return Promise.all(filePromises);
}

const AddIccaButton = ({ disabled, inputProps }) => {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  return (
    <>
      <input {...inputProps} id="contained-button-file" accept=".mapeoicca" />
      <label htmlFor="contained-button-file">
        <Zoom in key={1}>
          <Fab
            disabled={disabled}
            color="primary"
            variant="extended"
            aria-label="add map"
            component="span"
            classes={{ root: classes.fab, disabled: classes.fabDisabled }}
          >
            <AddIcon />
            {formatMessage(msgs.addMap)}
          </Fab>
        </Zoom>
      </label>
    </>
  );
};

const ConfirmDialog = ({ open, onCancel, confirm }) => {
  const { formatMessage } = useIntl();
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {confirm && confirm.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {confirm && confirm.content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {formatMessage(msgs.confirmCancel)}
        </Button>
        <Button onClick={confirm && confirm.action} color="primary" autoFocus>
          {formatMessage(msgs.confirmConfirm)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function Home({ location, initializing }) {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState();
  const [confirm, setConfirm] = useState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, createMap, retry] = useCreateBoundary();
  const [user] = useAuthState(firebase.auth());
  const [
    maps = [],
    loading,
  ] = useCollectionData(
    firebase
      .firestore()
      .collection(`groups/${user.uid}/iccas`)
      .orderBy("createdAt", "desc"),
    { idField: "id" }
  );

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length || !acceptedFiles[0].name.match(/.mapeoicca$/))
        return console.log("invalid file", acceptedFiles[0]);
      const files = await unzip(acceptedFiles[0]);
      createMap(files);
    },
    [createMap]
  );

  const handleDelete = useCallback(
    (id) => {
      const confirm = {
        title: formatMessage(msgs.confirmDeleteTitle),
        content: formatMessage(msgs.confirmDeleteDesc),
        action: () => {
          firebase
            .firestore()
            .collection(`groups/${user.uid}/iccas`)
            .doc(id)
            .delete()
            .then(() => setConfirmOpen(false));
        },
      };
      setConfirm(confirm);
      setConfirmOpen(true);
    },
    [formatMessage, user.uid]
  );

  const shareUrlBase = `/api/groups/${user.uid}/iccas/`;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
  });

  if (loading || initializing) return <LoadingScreen />;

  return (
    <div {...getRootProps()} className={classes.root}>
      <AddIccaButton
        disabled={state.value === "loading"}
        inputProps={getInputProps()}
      />
      <Container maxWidth="md" className={classes.container}>
        <TransitionGroup>
          {state.value === "loading" && (
            <Grow in>
              <UploadProgress
                state={state.value}
                error={state.error}
                retry={retry}
              />
            </Grow>
          )}
          {maps
            .filter((map) => map.id !== state.id || state.value === "done")
            .map((map) => (
              <Grow in key={map.id}>
                <IccaItem
                  {...map}
                  onDelete={handleDelete}
                  onEdit={(id) => setEditing(id)}
                  shareUrl={shareUrlBase + map.id}
                />
              </Grow>
            ))}
        </TransitionGroup>
        {state.value !== "loading" && !maps.length && (
          <Typography
            variant="body1"
            color="textSecondary"
            className={classes.text}
            component={BalanceText}
            align="center"
          >
            {formatMessage(msgs.empty)}
          </Typography>
        )}
      </Container>
      <EditDialog
        open={!!editing}
        id={editing}
        onClose={() => setEditing(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        confirm={confirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 24,
    paddingTop: 36,
    alignItems: "stretch",
  },
  loading: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 400,
    display: "block",
  },
  fab: {
    position: "absolute",
    top: -24,
    zIndex: 2,
    left: 24,
  },
  fabDisabled: {
    backgroundColor: "#cccccc !important",
  },
  text: {
    maxWidth: "30em",
    alignSelf: "center",
    paddingTop: 24,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: "1.3em",
  },
});

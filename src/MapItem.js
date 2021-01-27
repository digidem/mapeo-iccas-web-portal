import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import Typography from "@material-ui/core/Typography";
import LinkIcon from "@material-ui/icons/Link";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import { defineMessages, useIntl } from "react-intl";

const msgs = defineMessages({
  publicLink: {
    id: "public_link_tooltip",
    defaultMessage: "Public link to Map"
  },
  edit: {
    id: "edit_tooltip",
    defaultMessage: "Edit Map details"
  },
  replaceData: {
    id: "upload_new_data",
    defaultMessage: "Upload new data"
  },
  deleteMap: {
    id: "delete_map",
    defaultMessage: "Delete Map"
  }
});

export default function MapItem({
  id,
  title,
  description,
  onDelete,
  onEdit,
  shareUrl
}) {
  const classes = useStyles();
  const { formatMessage } = useIntl();

  return (
    <Card className={classes.root}>
      <div className={classes.actions}>
        <Typography variant="h5" component="h2" className={classes.title}>
          {title}
        </Typography>
        <Tooltip title={formatMessage(msgs.publicLink)} placement="top">
          <IconButton component="a" href={shareUrl} target="_blank">
            <LinkIcon />
          </IconButton>
        </Tooltip>
        {/* Temporarily disable edit functionality
        <Tooltip title={formatMessage(msgs.edit)} placement="top">
          <IconButton onClick={() => onEdit(id)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        */}
        <Tooltip title={formatMessage(msgs.deleteMap)} placement="top">
          <IconButton onClick={() => onDelete(id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>
      <Typography
        variant="body2"
        color="textSecondary"
        component="p"
        className={classes.description}
      >
        {description}
      </Typography>
    </Card>
  );
}

const useStyles = makeStyles({
  root: {
    margin: 12
  },
  actions: {
    display: "flex",
    alignItems: "center",
    minHeight: 48,
    padding: 8,
    paddingBottom: 0
  },
  title: {
    flexGrow: 1,
    marginLeft: 8
  },
  description: {
    padding: 16,
    paddingTop: 0
  }
});

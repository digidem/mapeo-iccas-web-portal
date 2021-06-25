import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Card, CardMedia, CardActions, CardHeader } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import { defineMessages, useIntl } from "react-intl";
import { encode } from "geojson-polyline";

const msgs = defineMessages({
  publicLink: {
    id: "public_link_tooltip",
    defaultMessage: "Public link to Map",
  },
  edit: {
    id: "edit_tooltip",
    defaultMessage: "Edit Map details",
  },
  replaceData: {
    id: "upload_new_data",
    defaultMessage: "Upload new data",
  },
  deleteIcca: {
    id: "delete_icca",
    defaultMessage: "Delete ICCA",
  },
});

const MAP_SIZE = [400, 300];

export default function MapItem({ id, title, subheader, geometry, onDelete }) {
  const classes = useStyles();
  const { formatMessage } = useIntl();

  return (
    <Card className={classes.root}>
      <CardMedia
        className={classes.map}
        image={getMapboxStaticMapUrl(geometry, { width: 400, height: 300 })}
        title="Static map of ICCA boundary"
      />
      <CardHeader title={title} subheader={subheader} />
      <CardActions disableSpacing>
        {/* Temporarily disable share functionality
        <Tooltip title={formatMessage(msgs.publicLink)} placement="top">
          <Button
            variant="contained"
            color="default"
            className={classes.button}
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </Tooltip> */}
        {/* Temporarily disable edit functionality
        <Tooltip title={formatMessage(msgs.edit)} placement="top">
          <IconButton onClick={() => onEdit(id)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        */}
        <Tooltip title={formatMessage(msgs.deleteIcca)} placement="top">
          <IconButton
            onClick={() => onDelete(id)}
            className={classes.deleteButton}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 12,
    maxWidth: MAP_SIZE[0],
  },
  map: {
    width: MAP_SIZE[0],
    height: MAP_SIZE[1],
  },
  title: {
    flexGrow: 1,
    marginLeft: 8,
  },
  description: {
    padding: 16,
    paddingTop: 0,
  },
  deleteButton: {
    marginLeft: "auto",
  },
  button: {
    margin: theme.spacing(1),
  },
}));

function getMapboxStaticMapUrl(
  geometry,
  {
    strokeColor = "11ff00",
    strokeOpacity = 0.9,
    fillColor = "000000",
    fillOpacity = 0.2,
    strokeWidth = 3,
    width = 300,
    height = 200,
  } = {}
) {
  const { coordinates } = encode(geometry, { precision: 5 });
  const polyline = encodeURIComponent(coordinates);
  const retina = window.devicePixelRatio > 1 ? "@2x" : "";
  const mapboxToken =
    "pk.eyJ1IjoiZGlnaWRlbSIsImEiOiJja3FiNTBuMnYwamEyMnZvdmw0cDB2YWUzIn0.TKWZTpRSPVZOvDagjuVaZw";
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/path-${strokeWidth}+${strokeColor}-${strokeOpacity}+${fillColor}-${fillOpacity}(${polyline})/auto/${width}x${height}${retina}?access_token=${mapboxToken}`;
}

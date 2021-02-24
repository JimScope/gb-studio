import { clipboard } from "electron";
import uniq from "lodash/uniq";
import flatten from "lodash/flatten";
import {
  getCustomEventIdsInEvents,
  getCustomEventIdsInActor,
  getCustomEventIdsInScene,
} from "../../../lib/helpers/eventSystem";
import { Dictionary, Middleware, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import {
  customEventSelectors,
  actorSelectors,
  triggerSelectors,
  variableSelectors,
  metaspriteSelectors,
  metaspriteTileSelectors,
} from "../entities/entitiesState";
import {
  CustomEvent,
  Metasprite,
  MetaspriteTile,
} from "../entities/entitiesTypes";
import actions from "./clipboardActions";
import entitiesActions from "../entities/entitiesActions";
import editorActions from "../editor/editorActions";
import confirmReplaceCustomEvent from "../../../lib/electron/dialog/confirmReplaceCustomEvent";
import { copy, pasteAny } from "./clipboardHelpers";
import {
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
} from "./clipboardTypes";
import clipboardActions from "./clipboardActions";

const clipboardMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (actions.copyActor.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInActor(action.payload));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);
    const usedVariables = allVariables.filter((variable) => {
      return variable.id.startsWith(action.payload.id);
    });
    clipboard.writeText(
      JSON.stringify(
        {
          actor: action.payload,
          __type: "actor",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables: usedVariables.length > 0 ? usedVariables : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.copyTrigger.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(
      getCustomEventIdsInEvents(action.payload.script)
    );
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);
    const usedVariables = allVariables.filter((variable) => {
      return variable.id.startsWith(action.payload.id);
    });
    clipboard.writeText(
      JSON.stringify(
        {
          trigger: action.payload,
          __type: "trigger",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables: usedVariables.length > 0 ? usedVariables : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.copyScene.match(action)) {
    const state = store.getState();
    const actors = actorSelectors.selectEntities(state);
    const triggers = triggerSelectors.selectEntities(state);

    const scene = {
      ...action.payload,
      actors: action.payload.actors.map((actorId) => actors[actorId]),
      triggers: action.payload.triggers.map((triggerId) => triggers[triggerId]),
    };

    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInScene(scene));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);

    const entityIds = [
      action.payload.id,
      ...action.payload.actors,
      ...action.payload.triggers,
    ];
    const usedVariables = allVariables.filter((variable) => {
      return entityIds.find((id) => variable.id.startsWith(id));
    });

    clipboard.writeText(
      JSON.stringify(
        {
          scene,
          __type: "scene",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables: usedVariables.length > 0 ? usedVariables : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.copyEvent.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(
      getCustomEventIdsInEvents([action.payload])
    );
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          event: action.payload,
          __type: "event",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.copyScript.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.payload));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          script: action.payload,
          __type: "script",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.pasteCustomEvents.match(action)) {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__customEvents) {
        const state = store.getState();

        clipboardData.__customEvents.forEach((customEvent: CustomEvent) => {
          const customEventsLookup = customEventSelectors.selectEntities(state);
          const existingCustomEvent = customEventsLookup[customEvent.id];

          if (existingCustomEvent) {
            if (
              JSON.stringify(customEvent) ===
              JSON.stringify(existingCustomEvent)
            ) {
              // Already have this custom event
              return;
            }

            // Display confirmation and stop replace if cancelled
            const cancel = confirmReplaceCustomEvent(existingCustomEvent.name);
            if (cancel) {
              return;
            }
          }

          store.dispatch(
            entitiesActions.editCustomEvent({
              customEventId: customEvent.id,
              changes: customEvent,
            })
          );
        });
      }
    } catch (err) {
      // Ignore
    }
  } else if (actions.copyText.match(action)) {
    clipboard.writeText(action.payload);
  } else if (actions.copyMetasprites.match(action)) {
    const state = store.getState();
    const metaspritesLookup = metaspriteSelectors.selectEntities(state);
    const metaspriteTilesLookup = metaspriteTileSelectors.selectEntities(state);

    const metasprites = action.payload.metaspriteIds
      .map((id) => {
        return metaspritesLookup[id];
      })
      .filter((metasprite): metasprite is Metasprite => !!metasprite);

    const metaspriteTileIds = flatten(
      metasprites.map((metasprite) => metasprite.tiles)
    );

    const metaspriteTiles = metaspriteTileIds
      .map((tileId) => {
        return metaspriteTilesLookup[tileId];
      })
      .filter((tile): tile is MetaspriteTile => !!tile);

    copy({
      format: ClipboardTypeMetasprites,
      data: {
        metasprites,
        metaspriteTiles,
      },
    });
  } else if (actions.copyMetaspriteTiles.match(action)) {
    const state = store.getState();
    const metaspriteTilesLookup = metaspriteTileSelectors.selectEntities(state);
    const metaspriteTiles = action.payload.metaspriteTileIds
      .map((tileId) => {
        return metaspriteTilesLookup[tileId];
      })
      .filter((tile): tile is MetaspriteTile => !!tile);
    copy({
      format: ClipboardTypeMetaspriteTiles,
      data: {
        metaspriteTiles,
      },
    });
  } else if (actions.fetchClipboard.match(action)) {
    const clipboard = pasteAny();
    if (clipboard) {
      store.dispatch(clipboardActions.setClipboardData(clipboard));
    } else {
      store.dispatch(clipboardActions.clearClipboardData());
    }
  } else if (actions.pasteSprite.match(action)) {
    const clipboard = pasteAny();

    if (!clipboard) {
      return next(action);
    }
    if (clipboard.format === ClipboardTypeMetasprites) {
      const data = clipboard.data;

      const newActions = data.metasprites.map((metasprite) => {
        return entitiesActions.addMetasprite({
          spriteAnimationId: action.payload.spriteAnimationId,
        });
      });

      for (const action of newActions) {
        store.dispatch(action);
      }

      const newIds = newActions.map((action) => action.payload.metaspriteId);

      const tileIdMetaspriteLookup = data.metasprites.reduce(
        (memo, metasprite, index) => {
          for (let tileId of metasprite.tiles) {
            memo[tileId] = newIds[index];
          }
          return memo;
        },
        {} as Dictionary<string>
      );

      const newTileActions = data.metaspriteTiles.map((tile) => {
        return entitiesActions.addMetaspriteTile({
          metaspriteId: tileIdMetaspriteLookup[tile.id] || "",
          x: tile.x,
          y: tile.y,
          sliceX: tile.sliceX,
          sliceY: tile.sliceY,
        });
      });

      for (const action of newTileActions) {
        store.dispatch(action);
      }

      const newTileIds = newTileActions.map(
        (action) => action.payload.metaspriteTileId
      );

      store.dispatch(editorActions.setSelectedMetaspriteTileIds(newTileIds));
    } else if (clipboard.format === ClipboardTypeMetaspriteTiles) {
      const data = clipboard.data;

      const newActions = data.metaspriteTiles.map((tile) => {
        return entitiesActions.addMetaspriteTile({
          metaspriteId: action.payload.metaspriteId,
          x: tile.x,
          y: tile.y,
          sliceX: tile.sliceX,
          sliceY: tile.sliceY,
        });
      });

      for (const action of newActions) {
        store.dispatch(action);
      }

      const newIds = newActions.map(
        (action) => action.payload.metaspriteTileId
      );

      store.dispatch(editorActions.setSelectedMetaspriteTileIds(newIds));
    }
  }

  next(action);
};

export default clipboardMiddleware;

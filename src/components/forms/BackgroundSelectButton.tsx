import React, { FC, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import assetsActions from "store/features/assets/assetsActions";
import { SelectMenu, selectMenuStyleProps } from "ui/form/Select";
import { RelativePortal } from "ui/layout/RelativePortal";
import { BackgroundSelect } from "./BackgroundSelect";
import { assetURLStyleProp } from "shared/lib/helpers/assets";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MAX_BACKGROUND_TILES, MAX_BACKGROUND_TILES_CGB } from "consts";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";

interface BackgroundSelectProps {
  name: string;
  value?: string;
  is360: boolean;
  tilesetId: string;
  includeInfo?: boolean;
  onChange?: (newId: string) => void;
}

interface WrapperProps {
  includeInfo?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: relative;
  display: flex;
  min-width: 0;
  width: 67px;
  ${(props) =>
    props.includeInfo
      ? css`
          width: 100%;
        `
      : ""}

  & * {
    min-width: 0;
  }
`;

const Thumbnail = styled.div`
  width: 55px;
  height: 50px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
`;

const Button = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  text-align: left;

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :focus,
  &&&:focus:not(.focus-visible) {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
  }
`;

const ButtonContent = styled.div`
  display: flex;
  width: 100%;
  height: 60px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 5px;
`;

const SpriteInfo = styled.div`
  margin-left: 5px;
  overflow: hidden;
  width: 100%;
  font-size: 11px;
  height: 100%;

  & > *:not(:last-child) {
    margin-bottom: 3px;
  }
`;

const SpriteInfoTitle = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
  font-weight: bold;
`;

interface SpriteInfoRowProps {
  error?: boolean;
}

const SpriteInfoRow = styled.div<SpriteInfoRowProps>`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
  opacity: 0.7;

  ${(props) =>
    props.error
      ? css`
          color: red;
        `
      : ""}
`;

const SpriteInfoField = styled.span`
  margin-right: 5px;
`;

const NoValue = styled.div`
  width: 24px;
`;

export const Pill = styled.span`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 2px;
  margin-left: 3px;
  font-size: ${(props) => props.theme.typography.fontSize};

  :active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

export const BackgroundSelectButton: FC<BackgroundSelectProps> = ({
  name,
  value,
  onChange,
  is360,
  tilesetId,
  includeInfo,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, value || "")
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const numTiles = useAppSelector(
    (state) => state.assets.backgrounds[value || ""]?.numTiles
  );
  const isCGBOnly = useAppSelector(
    (state) => state.project.present.settings.colorMode === "color"
  );
  const isColor = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono"
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (value) {
      dispatch(
        assetsActions.loadBackgroundAssetInfo({
          backgroundId: value,
          tilesetId,
          is360,
        })
      );
    }
  }, [dispatch, value, is360, tilesetId]);

  useEffect(() => {
    if (buttonFocus) {
      window.addEventListener("keydown", onKeyDownClosed);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownClosed);
    };
  }, [buttonFocus]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", onKeyDownOpen);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownOpen);
    };
  }, [isOpen]);

  const onKeyDownClosed = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setIsOpen(true);
    }
  };

  const onKeyDownOpen = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const openMenu = () => {
    setIsOpen(true);
    cancelDelayedButtonFocus();
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const onSelectChange = (newValue: string) => {
    closeMenu();
    onChange?.(newValue);
    buttonRef.current?.focus();
  };

  const onButtonFocus = () => {
    setButtonFocus(true);
  };

  const onButtonBlur = () => {
    setButtonFocus(false);
  };

  const delayedButtonFocus = () => {
    timerRef.current = setTimeout(() => {
      buttonRef.current?.focus();
    }, 100);
  };

  const cancelDelayedButtonFocus = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <Wrapper includeInfo={includeInfo}>
      <Button
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
      >
        <ButtonContent>
          {background ? (
            <Thumbnail
              style={{
                backgroundImage:
                  background && assetURLStyleProp("backgrounds", background),
              }}
            />
          ) : (
            <NoValue />
          )}
          {includeInfo && (
            <SpriteInfo>
              <SpriteInfoTitle>
                {background?.name}
                {isColor && background?.autoColor && background.monoOverrideId && (
                  <Pill
                    title={l10n("FIELD_MONO_OVERRIDE_DESC", {
                      filename: background.filename,
                      tilesFilename: monoOverrideForFilename(
                        background.filename
                      ),
                    })}
                  >
                    +
                  </Pill>
                )}
              </SpriteInfoTitle>

              <SpriteInfoRow>
                <SpriteInfoField>{l10n("FIELD_SIZE")}:</SpriteInfoField>
                {background?.width}x{background?.height}
              </SpriteInfoRow>
              <SpriteInfoRow
                error={
                  (numTiles > MAX_BACKGROUND_TILES_CGB ||
                    (!isCGBOnly && numTiles > MAX_BACKGROUND_TILES)) &&
                  !is360
                }
              >
                <SpriteInfoField>{l10n("FIELD_TILES")}:</SpriteInfoField>
                {numTiles}
              </SpriteInfoRow>
            </SpriteInfo>
          )}
        </ButtonContent>
      </Button>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}

      <div style={{ position: "absolute", top: "100%", left: "100%" }}>
        {isOpen && (
          <RelativePortal pin="top-right">
            <SelectMenu>
              <BackgroundSelect
                name={name}
                value={value}
                onChange={onSelectChange}
                onBlur={closeMenu}
                {...selectMenuStyleProps}
              />
            </SelectMenu>
          </RelativePortal>
        )}
      </div>
    </Wrapper>
  );
};

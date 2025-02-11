import React, { ReactElement } from "react"
import {
  AnyAssetMetadata,
  SmartContractFungibleAsset,
} from "@tallyho/tally-background/assets"
import { useTranslation } from "react-i18next"
import { updateAssetMetadata } from "@tallyho/tally-background/redux-slices/assets"
import { truncateAddress } from "@tallyho/tally-background/lib/utils"
import {
  selectCurrentAccountActivities,
  selectCurrentNetwork,
} from "@tallyho/tally-background/redux-slices/selectors"
import classNames from "classnames"
import { isUnverifiedAssetByUser } from "@tallyho/tally-background/redux-slices/utils/asset-utils"
import { setSnackbarMessage } from "@tallyho/tally-background/redux-slices/ui"
import { FeatureFlags, isEnabled } from "@tallyho/tally-background/features"
import { Activity } from "@tallyho/tally-background/redux-slices/activities"
import SharedButton from "../../Shared/SharedButton"
import { useBackgroundDispatch, useBackgroundSelector } from "../../../hooks"
import SharedSlideUpMenuPanel from "../../Shared/SharedSlideUpMenuPanel"
import SharedIcon from "../../Shared/SharedIcon"
import UnverifiedAssetBanner from "./UnverifiedAssetBanner"
import { getBlockExplorerURL } from "../../../utils/networks"

type AssetWarningProps = {
  asset: SmartContractFungibleAsset
  close: () => void
  openActivityDetails: (activity: Activity | undefined) => void
}

export default function AssetWarning(props: AssetWarningProps): ReactElement {
  const { t } = useTranslation("translation", {
    keyPrefix: "wallet.verifiedAssets",
  })
  const { t: sharedT } = useTranslation("translation", {
    keyPrefix: "shared",
  })

  const { asset, close, openActivityDetails } = props

  const dispatch = useBackgroundDispatch()

  const network = useBackgroundSelector(selectCurrentNetwork)

  const isUnverified = isUnverifiedAssetByUser(asset)

  const contractAddress =
    asset && "contractAddress" in asset && asset.contractAddress
      ? asset.contractAddress
      : ""

  const discoveryTxHash = asset.metadata?.discoveryTxHash

  const blockExplorerUrl = getBlockExplorerURL(network)

  const handleUpdateAssetMetadata = async (newMetadata: AnyAssetMetadata) => {
    const metadata = { ...asset.metadata, ...newMetadata }
    await dispatch(updateAssetMetadata({ asset, metadata }))
    dispatch(setSnackbarMessage(t("snackbar")))
    close()
  }

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash)
    dispatch(setSnackbarMessage(sharedT("copyTextSnackbar")))
  }

  const currentAccountActivities = useBackgroundSelector(
    selectCurrentAccountActivities
  )
  const activityItem = discoveryTxHash
    ? currentAccountActivities.find(({ hash }) => hash === discoveryTxHash)
    : undefined

  return (
    <SharedSlideUpMenuPanel header={t("assetImported")}>
      <div className="content">
        <div>
          <UnverifiedAssetBanner
            title={
              isUnverified
                ? t("banner.titleUnverified")
                : t("banner.titleVerified")
            }
            description={
              isEnabled(FeatureFlags.SUPPORT_UNVERIFIED_ASSET)
                ? t("banner.description")
                : t("banner.oldDescription")
            }
          />
          <ul className="asset_details">
            <li className="asset_symbol">
              <div className="left">{t("symbol")}</div>
              <div
                className="right ellipsis"
                title={asset?.symbol}
              >{`${asset?.symbol}`}</div>
            </li>
            <li>
              <div className="left">{t("contract")}</div>
              <div className="right">
                <div className="address_button_wrap">
                  <button
                    type="button"
                    className={classNames("address_button", {
                      no_click: !blockExplorerUrl,
                    })}
                    disabled={!blockExplorerUrl}
                    onClick={() =>
                      window
                        .open(
                          `${blockExplorerUrl}/token/${contractAddress}`,
                          "_blank"
                        )
                        ?.focus()
                    }
                  >
                    {truncateAddress(contractAddress)}
                    {blockExplorerUrl && (
                      <SharedIcon
                        width={16}
                        icon="icons/s/new-tab.svg"
                        color="var(--green-5)"
                        hoverColor="var(--trophy-gold)"
                        transitionHoverTime="0.2s"
                      />
                    )}
                  </button>
                </div>
              </div>
            </li>
            {discoveryTxHash && (
              <li>
                <div className="left">{t("discoveryTxHash")}</div>
                <div className="right">
                  <div className="address_button_wrap">
                    <button
                      type="button"
                      className={classNames("address_button", {
                        no_click: !blockExplorerUrl,
                      })}
                      onClick={() => {
                        if (activityItem) {
                          openActivityDetails(activityItem)
                        } else {
                          copyTxHash(discoveryTxHash)
                        }
                      }}
                      title={discoveryTxHash}
                    >
                      {truncateAddress(discoveryTxHash)}
                    </button>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
        <div>
          <div className="asset_verify_actions">
            {isEnabled(FeatureFlags.SUPPORT_UNVERIFIED_ASSET) ? (
              <>
                {/* TODO Add logic for deleting asset */}
                <SharedButton size="medium" type="secondary" onClick={() => {}}>
                  {t("dontShow")}
                </SharedButton>
                {isUnverified && (
                  <SharedButton
                    size="medium"
                    type="primary"
                    onClick={() =>
                      handleUpdateAssetMetadata({ verified: true })
                    }
                  >
                    {t("addToAssetList")}
                  </SharedButton>
                )}
              </>
            ) : (
              <SharedButton size="medium" type="secondary" onClick={close}>
                {sharedT("close")}
              </SharedButton>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .content {
          padding: 0 16px 16px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 82%;
        }
        ul.asset_details {
          display: block;
          margin-top: 16px;

          font-family: "Segment";
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
        }
        ul.asset_details > li {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .left {
          color: var(--green-20);
        }
        .right {
          color: var(--green-5);
          width: 50%;
          text-align: right;
        }
        .asset_verify_actions {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }
        .address_button_wrap {
          display: flex;
          justify-content: end;
          width: 100%;
        }
        .address_button {
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }
        .address_button:hover {
          color: var(--trophy-gold);
        }
        .address_button .no_click {
          pointer-events: none;
        }
      `}</style>
      <style global jsx>
        {`
          .address_button:hover .icon {
            background-color: var(--trophy-gold);
          }
        `}
      </style>
    </SharedSlideUpMenuPanel>
  )
}

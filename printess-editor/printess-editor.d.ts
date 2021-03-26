
import { api, externalFormFieldChangeCallback, externalGetOverlayCallback, externalSelectionChangeCallback, externalSpreadChangeCallback, iExternalImage, iExternalMetaPropertyKind, iExternalNumberUi, iExternalProperty, iExternalSpreadInfo, textStyleModeEnum } from "./externalApi.js";

export interface UploadProvider {
  upload: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>; //der muss die Urls zurückgeben
  beforeAddingFormData?: (formData: FormData, blob: Blob, fileName: string) => void;
}
 
export type ProgressCallback = (uploaded: number, total: number) => void;

export type UploadResult = {
  originalFormName?: string,
  id: string,
  url: string,
  userState?: string | number | Record<string, unknown>
}
export interface printessAttachParameters {
    resourcePath?: string;
    domain?: string;
    token?: string;
    uploadProvider?: UploadProvider;
    div: HTMLDivElement;
    autoScale?: {
        maxWidth: number;
        maxHeight: number;
    };
    templateName?: string;
    templateJson?: string;
    templateUserId?: string;
    mergeTemplates?: [{
        templateName: string;
        templateUserId?: string;
    }];
    loadingFadeCallback?: () => void;
    loadingDoneCallback?: (spread: Array<iExternalSpreadInfo>) => void;
    showBuyerSide?: boolean;
    hideControls?: boolean;
    allowZoomAndPan: boolean;
    zoomDuration?: number;
    formFieldChangedCallback?: externalFormFieldChangeCallback;
    selectionChangeCallback?: externalSelectionChangeCallback;
    spreadChangeCallback?: externalSpreadChangeCallback;
    getOverlayCallback?: externalGetOverlayCallback;
    forceMultilineFormEditing?: boolean;
    splitMultilineToParagraphs?: boolean;
    enterImageCropingOnSelect?: boolean;
    singleSelectionOnly?: boolean;
    scaledImageMinimumDpi?: number;
    fullScreenOnMobile?: boolean;
}
export declare function attachPrintess(p: printessAttachParameters): Promise<typeof api>;
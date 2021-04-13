export interface printessAttachParameters {
  resourcePath?: string;
  domain?: string;
  token?: string;
  uploadProvider?: UploadProvider;
  div: HTMLDivElement;
  /*  when used in shop (shop token) scenario, you MUST provide basketId */
  basketId?: string, 
  /* when used in shop (shop token) scenario, you CAN provide shopUserId */
  shopUserId?: string, 
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

/*
* UPLOAD
*/
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


export declare type iExternalFormFieldInfos = Array<iExternalFormFieldInfo>;
export interface iExternalFormFieldInfo {
name: string;
values: Array<string>;
}
export interface iExternalSpreadInfo {
spreadId: string;
index: number;
name: string;
width: number;
height: number;
thumbUrl: string | null;
pages: number;
}
export interface iExternalSpread {
groupSnippets: ReadonlyArray<iExternalSnippet>;
layoutSnippets: ReadonlyArray<iExternalSnippet>;
spreadId: string;
}
export interface iExternalSnippetCluster {
name: string;
snippets: Array<iExternalSnippet>;
}
export interface iExternalSnippet {
title: string;
snippetUrl: string;
thumbUrl: string;
bgColor: string;
}
export interface iExternalFrameBounds {
zoom: number;
pageOffsetY: number;
pageOffsetX: number;
left: number;
top: number;
width: number;
height: number;
boxId: string;
}
export declare type iExternalPropertyKind = "color" | "single-line-text" | "multi-line-text" | "selection-text-style" | "number" | "image" | "form-field";
export declare type iExternalMetaPropertyKind = null | "text-style-color" | "text-style-size" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" | "image-scale" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-hueRotate";
export interface iExternalProperty {
id: string;
value: string | number;
kind: iExternalPropertyKind;
label: string;
textStyle?: iExternalTextStyle;
imageMeta?: iExternalimageMeta;
textMeta?: iExternalTextMeta;
}
export interface iExternalTextStyle {
size: string;
color: string;
font: string;
hAlign: "bullet" | "left" | "center" | "right" | "justifyLeft" | "justifyCenter" | "justifyRight" | "justifyJustify";
vAlign: "top" | "center" | "bottom";
allows: Array<"content" | "mandatory" | "color" | "stroke" | "font" | "size" | "lineHeight" | "tracking" | "baselineShift" | "horizontalAlignment" | "verticalAlignment" | "padding" | "styles" | "bullet" | "indent" | "paragraphSpacing" | "baselineGrid">;
}
export interface iExternalTextMeta {
maxChars: number;
defaultValue: string;
isMandatory: boolean;
}
export interface iExternalTextMeta {
maxChars: number;
defaultValue: string;
isMandatory: boolean;
}
export interface iExternalNumberUi {
max: number;
min: number;
step: number;
digits: number;
postfix: string;
restrictRange?: boolean;
restrictStep?: boolean;
}
export interface iExternalNumberMeta {
max: number;
min: number;
step: number;
digits: number;
postfix: string;
restrictRange?: boolean;
restrictStep?: boolean;
uiOffset?: number;
uiMultiplier?: number;
}
export interface iExternalimageMeta {
scale: number;
scaleHints: iExternalImageScaleHints;
sepia: number;
brightness: number;
contrast: number;
vivid: number;
hueRotate: number;
thumbUrl: string;
thumbCssUrl: string;
defaultValue: string;
isMandatory: boolean;
allows: Array<"sepia" | "brightness" | "contrast" | "vivid" | "hueRotate">;
}
export interface iExternalImageScaleHints {
min: number;
max: number;
dpiAtScale1: number;
}
export declare type externalFormFieldChangeCallback = (name: string, value: string) => void;
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>) => void;
export declare type externalSpreadChangeCallback = (groupSnippets: ReadonlyArray<iExternalSnippetCluster>, layoutSnippets: ReadonlyArray<iExternalSnippetCluster>, spread: {
id: string;
name: string;
index: number;
}, spreadCount: number) => void;
export declare type externalGetOverlayCallback = (properties: Array<iExternalProperty>) => HTMLDivElement;
export declare type textStyleModeEnum = "default" | "all-paragraphs" | "all-paragraphs-if-no-selection";
export interface iExternalImage {
id: string;
thumbUrl: string;
thumbCssUrl: string;
width: number;
height: number;
}

export interface iStoryContent {
pts: Array<any> // Array<iParagraphTextAndStyles>
}

/*
* Main call to load printess to div
*/
export declare function attachPrintess(p: printessAttachParameters): Promise<typeof api>;


/*
* JS-API Methods
*/
export declare const api: {

getJson(): string;
setJson(jsonString: string): Promise<void>;

saveJson(): Promise<string>;
loadJson(id: string): Promise<void>;
unexpireJson(id: string): Promise<void>;

clearSelection(): Promise<void>;
deleteSelectedFrames(): Promise<boolean>;
selectFrames(propertyId: string): Promise<void>;
selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

getAllSpreads(): Promise<Array<iExternalSpreadInfo>>;
getAllProperties(): Promise<Array<Array<iExternalProperty>>>;
getAllPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;
getAllRequiredProperties(): Promise<Array<Array<iExternalProperty>>>;
getAllRequiredPropertiesSync(): Array<Array<iExternalProperty>>;
getAllRequiredPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;
getAllRequiredPropertiesBySpreadIdSync(spreadId: string): Array<Array<iExternalProperty>>;

setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void>;

getNumberUi(ep: iExternalProperty, metaProperty?: iExternalMetaPropertyKind | null): {
  meta: iExternalNumberUi;
  value: number;
} | undefined;
setNumberUiProperty(ep: iExternalProperty, metaProperty: iExternalMetaPropertyKind | null, value: number): Promise<void>;

setTextStyleProperty(propertyId: string, name: "font" | "color" | "size" | "hAlign" | "vAlign", value: string, textStyleMode?: textStyleModeEnum): Promise<void>;
setImageMetaProperty(propertyId: string, name: "scale" | "sepia" | "brightness" | "saturate" | "contrast" | "grayscale" | "vivid" | "hueRotate", value: string | number): Promise<void>;
resetImageFilters(propertyId: string): Promise<void>;

uploadImages(files: FileList | null, progressCallback?: (percent: number) => void, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage[]>;
uploadImage(file: File, progressCallback?: (percent: number) => void, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage | null>;

getSerializedImage(imageId: string): string | null;
addSerializedImage(imageJson: string, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage>;

getImages(propertyId: string): Array<iExternalImage>;
getFonts(propertyId: string): Array<{
  name: string;
  thumbUrl: string;
}>;
getColors(propertyId: string): Array<{
  name: string;
  color: string;
}>;
resizePrintess(immediate?: boolean): void;

load(scopeId: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;

insertLayoutSnippet(snippetUrl: string): Promise<void>;
insertGroupSnippet(snippetUrl: string): Promise<void>;

undo(): void;
redo(): void;

renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;
};
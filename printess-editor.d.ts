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
  mergeTemplates?: [{
    templateName: string;
    spreadIndex?: number;
  }];
  loadingFadeCallback?: () => void;
  loadingDoneCallback?: (spread: Array<iExternalSpreadInfo>) => void;
  showBuyerSide?: boolean;
  hideControls?: boolean;
  allowZoomAndPan?: boolean;
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

export type iExternalPropertyKind = "color" | "single-line-text" | "text-area" | "title" | "background-button" | "multi-line-text" | "selection-text-style" | "number" | "image" | "select-list" | "image-list";

export type iExternalMetaPropertyKind = null |
  "text-style-color" | "text-style-size" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" |
  "image-scale" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-hueRotate";

export interface iExternalProperty {
  id: string;
  value: string | number;
  kind: iExternalPropertyKind;
  label: string;
  textStyle?: iExternalTextStyle;
  imageMeta?: iExternalimageMeta;
  textMeta?: iExternalTextMeta;
  listMeta?: iExternalListMeta;
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
export interface iExternalListMeta {
  list: Array<iExternalFieldListEntry>;
  thumbWidth: number;
  thumbHeight: number;
  imageCss: string;
}
export type iExternalFieldListEntry = {
  key: string,
  label: string, // multi-language??
  description: string,
  imageUrl: string
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
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>, scope: "document" | "frames" | "text") => void;
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
export interface iExternalButton {
  type: "callback" | "print",
  callback?: () => void,
  caption?: string
}


export interface iMobileUIButton {
  icon?: iconName | "none",
  thumbCssUrl?: string,
  circleStyle?: string;
  ffCircleCaption?: string,
  caption: string,
  newState: iMobileUiState
}

export interface iMobileUiState {
  state: typeof mobileUiStateNames[number],
  externalProperty?: iExternalProperty,
  metaProperty?: iExternalMetaPropertyKind, // can be null
  callback?: ((e: MouseEvent | TouchEvent | null) => void)
}

export interface iButtonCircle {
  hasSvgCircle: boolean,
  hasImage: boolean,
  hasCaption: boolean,
  hasColor: boolean,
  hasIcon: boolean,
  icon: iconName | "none",
  displayGauge: boolean,
  gaugeValue: number,
  isSelected: boolean,
  captionClass: string,
  captionInCircle: string,
  color: string
}

export interface iStoryContent {
  pts: Array<any> // Array<iParagraphTextAndStyles>
}

/*
* Main call to load printess to div
*/
export declare function attachPrintess(p: printessAttachParameters): Promise<iPrintessApi>;



/*
* JS-API Methods
*/
export declare const api: iPrintessApi;

export interface iPrintessApi {
  getJson(): string;
  setJson(jsonString: string): Promise<void>;

  loadTemplate(templateName: string): Promise<void>;

  saveJson(): Promise<string>;
  loadJson(id: string): Promise<void>;
  unexpireJson(id: string): Promise<void>;

  clearSelection(): Promise<void>;
  deleteSelectedFrames(): Promise<boolean>;
  selectFrames(propertyId: string): Promise<void>;
  selectBackground(): Promise<void>;
  selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;
  nextPage() : Promise<void>;
  previousPage(): Promise<void>; 
  pageInfo(): Promise<{current: number, max: number, isFirst: boolean, isLast: boolean}> 

  getAllSpreads(): Promise<Array<iExternalSpreadInfo>>;
  getAllProperties(): Promise<Array<Array<iExternalProperty>>>;
  getAllPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;
  getAllRequiredProperties(): Promise<Array<Array<iExternalProperty>>>;
  getAllRequiredPropertiesSync(): Array<Array<iExternalProperty>>;
  getAllRequiredPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;
  getAllRequiredPropertiesBySpreadIdSync(spreadId: string): Array<Array<iExternalProperty>>;

  getMobileUiButtons(properties: Array<iExternalProperty>): Array<iMobileUIButton>;
  

  getButtonCircleModel(m: iMobileUIButton, isSelected: boolean): iButtonCircle

  isTextButton(m: iMobileUIButton): boolean


  setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void>;

  setFormFieldValue(fieldNameOrId: string, newValue: string): Promise<void>;

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
    displayName: string;
  }>;
  getColors(propertyId: string): Array<{
    name: string;
    color: string;
  }>;

  getIcon(icon: iconName): SVGElement

  resizePrintess(immediate?: boolean): void;

  load(scopeId: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;

  insertLayoutSnippet(snippetUrl: string): Promise<void>;
  insertGroupSnippet(snippetUrl: string): Promise<void>;

  undo(): void;
  redo(): void;

  renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;
}

export type iconName =
  "image"
  | "portrait"
  | "bezier"
  | "text"
  | "pathText"
  | "magnet"
  | "pointer"
  | "close-square"
  | "close"
  | "docRef"
  | "collapseLeft"
  | "expandLeft"
  | "edit"
  | "pen"
  | "pencil-ruler"
  | "plus"
  | "plus-circle"
  | "plus-square"
  | "minus"
  | "shapes"
  | "square"
  | "settings"
  | "vector-shape"
  | "address-card"
  | "paperclip"
  | "facing-pages"
  | "page"
  | "cog"
  | "perspective"
  | "style"
  | "story"
  | "text-flow"
  | "exchange"
  | "text-align-justify-justify"
  | "text-align-justify-left"
  | "text-align-justify-right"
  | "text-align-justify-center"
  | "text-align-left"
  | "text-align-right"
  | "text-align-center"
  | "check"
  | "check-square"
  | "user-circle"
  | "user-solid"
  | "user-crown-solid"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "arrows"
  | "arrows-circle"
  | "arrows-h"
  | "arrows-v"
  | "carret-down-solid"
  | "carret-right-solid"
  | "text-size"
  | "text-width"
  | "line-height"
  | "line-width"
  | "palette"
  | "brush"
  | "undo"
  | "undo-solid"
  | "redo"
  | "redo-solid"
  | "copy"
  | "copy-solid"
  | "paste"
  | "cut"
  | "object-ungroup"
  | "trash"
  | "trash-solid"
  | "remove-format"
  | "clipboard"
  | "search-plus"
  | "search-minus"
  | "search-light"
  | "save"
  | "slash"
  | "empty"
  | "cloud-upload-alt"
  | "folder-open-solid"
  | "tint"
  | "warp-arc"
  | "warp-flag"
  | "warp-bulge"
  | "warp-arc-upper"
  | "warp-pit-upper"
  | "warp-arc-lower"
  | "warp-pit-lower"
  | "warp-fish"
  | "warp-squeeze"
  | "warp-mug"
  | "mesh"
  | "crop"
  | "fill-image"
  | "fit-image"
  | "vertical-align-bottom-baseline"
  | "vertical-align-center-baseline"
  | "vertical-align-center"
  | "vertical-align-top"
  | "vertical-align-bottom"
  | "warning"
  | "effects"
  | "robot"
  | "microchip"
  | "record"
  | "play"
  | "running"
  | "rotator"
  | "lock-closed"
  | "lock-open"
  | "lock-closed-solid"
  | "user-lock-closed"
  | "user-lock-opened"
  | "link"
  | "stroke-cap-round"
  | "stroke-cap-projecting"
  | "stroke-cap-butt"
  | "stroke-align-center"
  | "stroke-align-inside"
  | "stroke-align-outside"
  | "stroke-join-miter"
  | "stroke-join-round"
  | "stroke-join-bevel"
  | "wrap-both-sides"
  | "no-wrap"
  | "printess-wand"
  | "print-solid"
  | "shopping-cart"
  | "shopping-cart-solid"
  | "shopping-cart-add"
  | "folder-plus"
  | "eye-solid"
  | "eye-solid-slash"
  | "font"
  | "send-back"
  | "send-backward"
  | "bring-front"
  | "bring-forward"
  | "distort"
  | "list-ul"
  | "ellipsis-v"
  | "sun-light"
  | "adjust"
  | "scroll-old"
  | "align-top"
  | "align-middle"
  | "align-bottom"
  | "align-left"
  | "align-center"
  | "align-right"
  | "space-vertical-around"
  | "space-vertical-between"
  | "space-horizontal-around"
  | "space-horizontal-between"
  | "layer-group"
  | "ruler"
  | "layout-snippet"
  | "layout-snippet-invers"
  | "group-snippet"
  | "group-snippet-invers"
  | "primary-doc"
  | "primary-doc-invers"
  | "preview-doc"
  | "preview-doc-invers"
  | "production-doc"
  | "production-doc-invers"
  | "facebook-round"
  | "clock-solid"
  | "page-plus-solid"
  | "user-friends-solid"
  | "opacity"
  | "file-invoice"
  | "help"
  | "triangle-solid"
  | "pin-solid"
  | "pin"
  | "angle-right"
  | "angle-down"
  | "sync"
  | "mirror-x"
  | "mirror-y";
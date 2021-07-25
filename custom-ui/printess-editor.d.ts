
/** 
 * Main call to attach the Printess to div-element of your choice. 
 * In ```printessAttachParameters``` you can pass authorization, template-name and other parameters.
 */
export declare function attachPrintess(p: printessAttachParameters): Promise<iPrintessApi>;

export interface printessAttachParameters {
  resourcePath?: string;
  domain?: string;
  token?: string;
  uploadProvider?: UploadProvider;
  div: HTMLDivElement;
  /** 
   * when used in shop (shop token) scenario, you MUST provide basketId 
   */
  basketId?: string,
  /** 
   *  when used in shop (shop token) scenario, you CAN provide shopUserId  
   */
  shopUserId?: string,

  templateName?: string;
  /**
   *  The template version to load. For production you should go with "published" which is the default. 
   * */
  templateVersion?: "draft" | "published",

  /**
   * Optional parameter to merge any number of templates during load
   */
  mergeTemplates?: [{
    /**
     * Name of the template to load an merge into the currently loaded template 
     */
    templateName: string;
    /**
     * Name of the document you want to merge. If none is specified the primary document of the template will be taken.
     */
    documentName?: string;
    /**
     * At what spread index the incoming template will be merged
     */
    spreadIndex?: number;
  }];

  /**
   * Activated by default. Deactivating ```allowZoomAndPan``` freezes the visible Area of the current document. 
   * The buyer will not be able to zoom or pan at all. It's handy for simple configurattions on desktop and conjunction with ```autoScale```
   * Handle with care on mobile, since users proably need zoom to have a closer look on their products.
   */
  allowZoomAndPan?: boolean;

  /**
   * When zooming to a selected page, Printess uses a viewport transition. You can either set the transition duration in seconds or pass **0** to 
   * turn animation of completely.
   */
  zoomDuration?: number;

  /**
   * Auto scale is only usefull when ```hideControls```is active and ```allowZoomAndPan```is disabled.
   * Printess will adjust its width or height in between the given dimensions to meet the aspect ratio of the loaded document.
   */
  autoScale?: {
    maxWidth: number;
    maxHeight: number;
  };


  /**
   * If you application displays a loading animation, this call tells you to start
   * your fade-out animation. Loading will be done soon. 
   */
  loadingFadeCallback?: () => void;

  /**
   * Printess has completely loaded the requested template and is now ready to operate.
   */
  loadingDoneCallback?: () => void;

  /**
   * Force Showing Buyer-Side (Only valid if Service-Token is passed)
   * When Token is Shop-Token, Printess alwyas switches to Buyer-Side.
   */
  showBuyerSide?: boolean;

  /**
   * The initial form fields you want to fill.
   */
  formFields: Array<{ name: string, value: string }>;

  /**
   * For every Form Field which is set to **Impact-Price**
   * Printess fires a callback when the value has changed
   */
  formFieldChangedCallback?: externalFormFieldChangeCallback;

  /**
   * Here is the place to draw your properties ui.
   */
  selectionChangeCallback?: externalSelectionChangeCallback;

  /**
   * Fired whenever the user has selected a new page/spread and passes snippet-lists and spread-info.
   * Now it's time to redraw **Layout-Snippets** and **Group-Snippets**
   */
  spreadChangeCallback?: externalSpreadChangeCallback;

  /**
   * To indicate selectable frames Printess fires this callback where you can 
   * provide a custom div
   */
  getOverlayCallback?: externalGetOverlayCallback;


  /**
    * Minimum width of any image loaded in the browser
    * Default is 1600, best alternatives are 200, 400, 800
    * If you display the Printess editor very small in your website/shop
    * you might want to avoid the editor loading large images into memory. 
    * You can also set **minImageWidth** for certain products with many pages. 
    */
  minImageWidth?: number;


  /**
   * Provide a callback function which is called when the buyer presses the [Add to Basket] button
   * Design is automtically saved and function gets a [token] to load or print this design.
   */
  addToBasketCallback?: (saveToken: string, thumbnailUrl: string) => void,
  /**
   * Provide a callback function which is called when the buyer presses the [Back] button
   * Design is automtically saved and function gets a [token] to load or print this design
   */
  backButtonCallback?: (saveToken: string) => void,
}

/**
 * **iPrintessApi** is returned by the ```attachPrintess()``` call and provides you access to the Printess editor. 
 * You can retrieve informations, set properties, add snippets and much more.
 */
export interface iPrintessApi {
  getJson(): string;
  setJson(jsonString: string): Promise<void>;

  /**
   * Load a template to the Printess editor.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save. 
   */
  loadTemplate(templateNameOrToken: string): Promise<void>;

  /**
   * Saves current artwork and return a saveToken which you can pass in attach or loadJson()
   */
  saveJson(): Promise<string>;
  /**
   * Loads apreviously saved buyer artwork
   * @param saveToken a token you  have received from basket or back callback or from saveJson() call
   */
  loadJson(saveToken: string): Promise<void>;

  /**
   * Expects a apreviously saved buyer artwork identified by a saveToken and ensures that this work will never be deleted from DB
   * @param saveToken  
   */
  unexpireJson(saveToken: string): Promise<void>;

  /**
   * Returns the add to basket callback you have set in `attachPrintess()`
   */
  getAddToBasketCallback(): null | ((saveToken: string, url: string) => void);

  /**
   * Returns the back button callback you have set in `attachPrintess()`
   */
  getBackButtonCallback(): null | ((saveToken: string) => void);

  /**
   * Clears current printess frames selection and shows document-wide properties like form fields.
   */
  clearSelection(): Promise<void>;

  /**
   * Deletes all selected frames which are allowed to be removed by the buyer
   */
  deleteSelectedFrames(): Promise<boolean>;

  /**
   * Select frame by propertyId. Fires a subsequent selection changed callback.
   */
  selectFrames(propertyId: string): Promise<void>;

  /**
   * Selects all frames which are marked as **background**
   */
  selectBackground(): Promise<void>;

  /**
   * Selects a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part`parameter.
   * @param spreadIndex zero-based 
   * @param part  "entire" | "left-page" | "right-page"
   */
  selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Moves Printess focus to next page if available. Focus on single pages not spreads.
   */
  nextPage(): Promise<void>;

  /**
   * Moves Printess focus to previous page if available. Focus on single pages not spreads.
   */
  previousPage(): Promise<void>;

  /**
   * Retrieves information about the currently selected page. 
   * Returns natural page-number (current) staring from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents. 
   * Async version waits for Printess to be fully loaded.
   */
  pageInfo(): Promise<{ current: number, max: number, isFirst: boolean, isLast: boolean }>


  /**
   * Retrieves information about the currently selected page. 
   * Returns natural page-number (current) staring from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents. 
   * Sync version returns dummy data if Printess is not fully loaded.
   */
  pageInfoSync(): { current: number, max: number, isFirst: boolean, isLast: boolean }

  /**
   * Returns information about all spreads of the displayed document as an Array of `iExternalSpreadInfo` 
   */
  getAllSpreads(): Array<iExternalSpreadInfo>;

  /**
   * Returns total number of spreads (not pages)
   */
  spreadCount(): number

  /**
   * Returns all available properties in teh current document
   */
  getAllProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
   * Returns a list of all available properties on a specific spread
   * @param spreadId 
   */
  getAllPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;


  /**
  * Returns a list of all required properties (async)
  * @param spreadId 
  */
  getAllRequiredProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
    * Returns a list of all required properties (sync)
    * @param spreadId 
    */
  getAllRequiredPropertiesSync(): Array<Array<iExternalProperty>>;

  /**
  * Returns a list of all required properties on a specific spread (async)
  * @param spreadId 
  */
  getAllRequiredPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;
  /**
   * Returns a list of all required properties on a specific spread (sync)
   * @param spreadId 
   */
  getAllRequiredPropertiesBySpreadIdSync(spreadId: string): Array<Array<iExternalProperty>>;

  /**
   * Mobile UI helper method to convert a list of properties to a list of mobile buttons to show to the buyer
   * @param properties list of properties to get buttons from
   * @param propertyIdFilter can be the *id* of a specific property to get only property related buttons (for images and multi-line text)
   *                         "all" returns only top level buttons (no sub/meta property buttons)
   *                         "root" returns only top-level properties but sets the `hasCollapsedMetaProperties` flag if applicable
   */
  getMobileUiButtons(properties: Array<iExternalProperty>, propertyIdFilter: "all" | "root" | string): Array<iMobileUIButton>;


  /**
   * Mobile UI helper method to get model to draw a circle button including icons, gauge, etc.
   * uiHelper.js contains a method to create an SVG from this circle model
   * @param m The mobile button to create a circle for
   * @param isSelected If the button is selected
   */
  getButtonCircleModel(m: iMobileUIButton, isSelected: boolean): iButtonCircle

  /**
   * Returns if a iMobileUIButton should display text instead of an icon
   */
  isTextButton(m: iMobileUIButton): boolean

  /**
   * Sets the value of any top-level property passed to the external UI
   * @param propertyId 
   * @param propertyValue Must be string and will be converted if neccessary
   */
  setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void>;

  /**
   * Sets the vaue of a form field
   * @param fieldNameOrId 
   * @param newValue Must be string and will be converted if neccessary
   */
  setFormFieldValue(fieldNameOrId: string, newValue: string): Promise<void>;

  /**
   * Returns the number UI model for any numeric property
   * `iExternalNumberUi` and value will be returned and has min, max and step info
   * Important: Number models can have different value ranges than the values stored in printess for better user experience
   * uiHelper.js conatins a method to create a slider control from this model
   * @param property 
   * @param metaProperty 
   */
  getNumberUi(property: iExternalProperty, metaProperty?: iExternalMetaPropertyKind | null): {
    meta: iExternalNumberUi;
    value: number;
  } | undefined;
  /**
   * Sets a numric values based on a retrieved number model. 
   * Number models can have different value ranges than the values stored in printess 
   * If a number value has been retrieved by `getNumberUi` its mandatory to set it via `setNumberUiProperty`
   * @param property 
   * @param metaProperty 
   * @param value 
   */
  setNumberUiProperty(property: iExternalProperty, metaProperty: iExternalMetaPropertyKind | null, value: number): Promise<void>;

  /**
   * Method to set a text style meta-property
   * @param propertyId 
   * @param name 
   * @param value 
   * @param textStyleMode 
   */
  setTextStyleProperty(propertyId: string, name: "font" | "color" | "size" | "hAlign" | "vAlign", value: string, textStyleMode?: textStyleModeEnum): Promise<void>;

  /**
   * Method to set an image meta-property
   * Set the image itself via `setProperty()`
   * @param propertyId 
   * @param name 
   * @param value 
   */
  setImageMetaProperty(propertyId: string, name: "scale" | "sepia" | "brightness" | "saturate" | "contrast" | "grayscale" | "vivid" | "hueRotate", value: string | number): Promise<void>;

  /**
   * Resets all image filters (meta-values) of an image-property to default
   * @param propertyId 
   */
  resetImageFilters(propertyId: string): Promise<void>;

  /**
   * Uploads one or many images to Printess and can auto assign the first image
   * @param files 
   * @param progressCallback 
   * @param assignToFrameOrNewFrame Auto assigns the first image to the current slection or a specific frame
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
   */
  uploadImages(files: FileList | null, progressCallback?: (percent: number) => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage[]>;

  /**
   * Uploads a single image to Printess and can auto assign this image
   * @param file 
   * @param progressCallback 
   * @param assignToFrameOrNewFrame 
   * @param propertyId 
   */
  uploadImage(file: File, progressCallback?: (percent: number) => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  /**
   * Rotates an image by 90deg and saves the result as new image and assigns rotated image to frame automatically.
   * @param propertyId 
   * @param angle 
   */
  rotateImage(propertyId: string, angle: "0" | "90" | "180" | "270"): Promise<iExternalImage | null>
  getSerializedImage(imageId: string): string | null;
  addSerializedImage(imageJson: string, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage>;

  getImages(propertyId: string): Array<iExternalImage>;
  
  getFonts(propertyId: string): Array<{
    name: string; 
    thumbUrl: string; 
    displayName: string; 
    familyName: string; 
    weight: number;
    isItalic: boolean;
  }>;

  getColors(propertyId: string): Array<{
    name: string;
    color: string;
  }>;

  /**
   * Retrieves a SVG icon from printess
   * @param icon 
   */
  getIcon(icon: iconName): SVGElement

  /**
   * Returns true if printess has full Designer edit rights and is not running in Shop-Mode
   */
  isInDesignerMode(): boolean;

  /**
   * Trigger a resize and fit of the current page, can focus the selection alternatively.
   * @param immediate Optional: Determines if resize should wait for a second or happens immediatly
   * @param focusSelection Optional: Will zoom to current selection
   * @param width Optional: Overrides the retrieved offsetWidth of the printess container - helpfull when animation are longer running
   * @param height Optional: Overrides the retrieved offsetHeight of the printess container - helpfull when animation are longer running
   */
  resizePrintess(immediate?: boolean, focusSelection?: boolean, width?: number, height?: number): void;

  load(scopeId: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;

  getTemplateTitle(): string;

  insertLayoutSnippet(snippetUrl: string): Promise<void>;
  insertGroupSnippet(snippetUrl: string): Promise<void>;

  /**
   * Executes an undo step if available.
   */
  undo(): void;

  /**
   * Executes an redo step if available.
   */
  redo(): void;

  /**
   * Returns number of available undo steps
   */
  undoCount(): number

  /**
   * Returns number of available redo steps
   */
  redoCount(): number

  renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;

  isMobile(): boolean;

  getStep(): iBuyerStep | null;
  /**
   * Indicates if the current step has become inactive, because the user has selected other frames 
   * TRUE if the current step is part of the selection.
   */
  isCurrentStepActive(): boolean;
  /**
   * Indicates if the current template has buyer-steps 
   */
  hasSteps(): boolean
  /**
   * 
   */
  lastStep(): iBuyerStep | null;
  hasNextStep(): boolean;
  hasPreviousStep(): boolean;
  /**
   * Indicates if the next step is the preview document.
   */
  isNextStepPreview(): boolean;

  /**
   * Goes to the next available step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   */
  nextStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Goes to the previous step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   */
  previousStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns the total amount of available preview-steps. 0 indicates no preview
   */
  previewStepsCount(): number;

  /**
   * Goes directly to the preview-step-index 
   * @param previewIndex Zero based index of the preview steps. See also: previewStepsCount()
   * @param zoom overrides the frames zoom settings for all devices
   */
  async gotoPreviewStep(previewIndex: number = 0, zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the first step, helpful if you want to exit the preview step.
   * @param zoom overrides the frames zoom settings for all devices
   */
  async gotoFirstStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Turns the display of step numbers on or off
   */
  async displayStepNumbers(display: boolean): Promise<void>

  /**
   * Returns if step numbers are displayed 
   */
  stepNumbersDisplayed(): boolean

  /**
   * Displays a grey overlay on printess editor
   * @param message Message to show on overlay
   */
  showOverlay(message: string): void;

  /**
   * Hides printess editor overlay (see showOverlay())
   */
  hideOverlay(): void;

  /**
   * 
   * @param uploadEndpoint The target address to send the upload form data to. E.g. https://your-bucket.s3.eu-central-1.amazonaws.com/ 
   * @param serveEndpoint The url the files are served from. This can differ from the upload endpoint to make CDN distribution possible. E.g. https://mycloudfrontid.amazonaws.com/
   * @param keyGenerator The method to generate the S3 key. The built-in one just makes sure that the file name is unique per session.
   */
  createAwsUploaderProvider(uploadEndpoint: string, serveEndpoint?: string, keyGenerator?: (fileName: string) => string): AwsUploadProvider;
}

export interface iBuyerStep {
  index: number,
  boxId?: string,
  docId: string,
  title: string
}



/*
* UPLOAD
*/
export interface UploadProvider {
  /** The main method to upload data. */
  upload: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** Specialized method for uploading images. You can simply forward it to upload in case you don't need special handling of those. */
  uploadImage: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** Specialized method for uploading fonts. You can simply forward it to upload in case you don't need special handling of those. */
  uploadFont: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** This method is called before Printess adds the form data containing the data needed for the upload. Use it in case you must prepend some fields to the form data before. */
  beforeAddingFormData?: (formData: FormData, blob: Blob, fileName: string) => void;
}

export interface AwsUploadProvider extends UploadProvider {
  /** The method which generates the final key to store within S3. */
  keyGenerator: (fileName: string) => string;
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
  /**
   * Zero based spread index (not page nr)
   */
  index: number;
  /**
  * Name of spread if set by the designer
  */
  name: string;
  /**
  * Spread width in pixel
  */
  width: number;
  /**
  * Spread height in pixel
  */
  height: number;
  /**
  * Number of pages in this spread. Will be 1 or 2.
  */
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

export type iExternalPropertyKind = "color" | "single-line-text" | "text-area" | "background-button" | "multi-line-text" | "selection-text-style" | "number" | "image" | "select-list" | "image-list";

export type iExternalMetaPropertyKind = null |
  "text-style-color" | "text-style-size" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" |
  "image-scale" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-hueRotate";

export interface iExternalProperty {
  id: string;
  value: string | number;
  kind: iExternalPropertyKind;
  label: string;
  validation?: iExternalValidation;
  textStyle?: iExternalTextStyle;
  imageMeta?: iExternalimageMeta;
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
export interface iExternalValidation {
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
  allows: Array<"sepia" | "brightness" | "contrast" | "vivid" | "hueRotate">;
}
export interface iExternalImageScaleHints {
  min: number;
  max: number;
  dpiAtScale1: number;
}
export declare type externalFormFieldChangeCallback = (name: string, value: string) => void;
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>, scope: "document" | "frames" | "text") => void;
export declare type externalSpreadChangeCallback = (groupSnippets: ReadonlyArray<iExternalSnippetCluster>, layoutSnippets: ReadonlyArray<iExternalSnippetCluster>) => void;
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
  type: "callback" | "print" | "back" | "next" | "addToBasket" | "undo" | "redo",
  callback?: () => void,
  caption?: string
}


export interface iMobileUIButton {
  icon?: iconName | "none",
  thumbCssUrl?: string,
  circleStyle?: string;
  ffCircleCaption?: string,
  caption: string,
  hasCollapsedMetaProperties?: boolean,
  newState: iMobileUiState
}

export interface iMobileUiState {
  state: "ext-value" | "form-fields" | "add" | "selection" | "imageCrop"
  externalProperty?: iExternalProperty,
  metaProperty?: iExternalMetaPropertyKind
}


export type MobileUiState = "document" | "frames" | "add" | "details";

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
  | "carret-left-solid"
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
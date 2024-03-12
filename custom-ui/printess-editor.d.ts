import { tableAddOption } from "../classes/model/FormField";

/** 
 * Main call to attach the Printess to div-element of your choice. 
 * In ```printessAttachParameters``` you can pass authorization, template-name and other parameters.
 */
export declare function attachPrintess(p: printessAttachParameters): Promise<iPrintessApi>;


type SdxlStyle = "photographic"| "3d-model"| "analog-film"| "cinematic"| "Tilt-Shift"| "Long Exposure"|
"anime"| "comic-book"| "Craft Clay"| "digital-art"| "enhance"| "Advertising"|
"Alien"| "Horror"| "Neon Noir"| "Silhouette"|
"fantasy-art"| "line-art"| "low-poly"| "origami"| "pixel-art"|
"Abstract"| "Cubist"| "Graffiti"| "Impressionist"| "Pointillism"| "Pop Art"| "Psychedelic"| "Renaissance"|
"Steampunk"| "Surrealist"| "Watercolor"| "Retro Game"| "Architectural"| "Disco"| "Dreamscape"| "Dystopian"|
"Fairy Tale"| "Gothic"| "Grunge"| "Minimalist"| "Monochrome"| "Space"| "Stained Glass"|
"Tribal"| "Zentangle"| "Flat Papercut"| "Papercut Shadow Box"| "Stacked Papercut"| "Kirigami"| "Paper Mache"| "Paper Quilling"| "Papercut Collage"|
"Thick Layered Papercut"

interface iImage {
  fileName: string,
  original: iScaledImage,
  source?: iScaledImage, // in case it's not png or jpg, this one contains the info about the source file (pdf, svg, tif etc)
  scaledVersions?: iScaledImage[]
  originalOrder?: number,
  originalGroup?: string,
  version?: number,
  average?: number // number ranging from 0-255 (0 full black, 255 full white), the average of the image pixel values
}

interface iScaledImage {
  id: string,
  url: string,
  width: number,
  height: number,
  userState?: string | number | Record<string, unknown>,
  isImmutable?: boolean,
  fileHash?: string,
  version?: number
}

export type ErrorName = "templateNotFound"

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
  mergeTemplates?: iMergeTemplate[];

  /**
   * Optional parameter for a content template (save token).
   * This save token can be used to fill out buyer editable images and texts automatically.
   * The content of this template is taken and applied to the template which should be loaded.
   */
  contentTemplate?: {
    saveToken: string,
    content?: "all" | "images" | "text"
  };

  /**
   * Optional parameter to merge all frame and document properties which have an exchange-id set.
   * It loads an existing save token and takes over data onto the newly loaded template.
   * It also can take overform-field values.
   */
  loadExchangeData?: {
    saveToken: string,
    exchangeFormFields: boolean,
    exchangeFrames: boolean,
    exchangeDocuments: boolean
  },

  /**
   * Activated by default. Deactivating `allowZoomAndPan` freezes the visible Area of the current document. 
   * The buyer will not be able to zoom or pan at all. It's handy for simple configurattions on desktop and conjunction with ```autoScale```
   * Handle with care on mobile, since users proably need zoom to have a closer look on their products.
   */
  allowZoomAndPan?: boolean;

  /**
   * Auto scale document view. 
   * Mostly useful on iOS devices which tend to crash when using big document sizes.
   * "auto" will automatically check for Safari on iOS devices.
   * Please set it to "always" when using Printess in iOS apps!
   * Default: "auto"
   */
  scaleDocumentView?: "auto" | "always";


  /**
   * When zooming to a selected page, Printess uses a viewport transition. You can either set the transition duration in seconds or pass **0** to 
   * turn animation of completely.
   */
  zoomDuration?: number;

  /**
   * Auto scale is only usefull when `allowZoomAndPan`is disabled.
   * Printess will adjust its width or height in between the given dimensions to meet the aspect ratio of the loaded document.
   */
  autoScale?: {
    maxWidth: number;
    maxHeight: number;
  };

  /**
   * list if custom-translations to be used by Printess buyer-side.
   * If set, it overrides all translations from your account-settings
   * https://printess.com/kb/api-reference/custom-integration.html#translations
   */
  translations?: Record<string, Record<string, string> | string>;

  /**
   * Pass key of desired languages, fallbacks to "auto" -> window.navigator.language
   */
  translationKey?: string | "auto";

  /**
   * To prevent the use of offensive language in customizeable texts, you can pass a list of forbidden words.
   * The use of offensive words can either throw an error during the validation or trigger the replacement of a bad word. 
   * https://printess.com/kb/api-reference/custom-integration.html#offensive-language
   */
  offensiveWords?: string,

  /**
   * Enables offensive word check for all editable text frames 
   */
  offensiveCheckAll?: boolean,

  /**
  * Disables thumbnail-creation when pressing the add to basket button.
  * Its checked only in uiHelper. 
  * Thumbnails can independendtly created with:
  * `const url = await printess.renderFirstPageImage("thumbnail.png");`
  */
  noBasketThumbnail?: boolean,

  /**
   * Optional: set frame warnings via api (can be set in template-presets as well) 
   */
  showFrameWarnings?: "sign and hint" | "sign only" | "hint only" | "none";

  /**
   * Turns animations for selected frames of, no matter what is set in the template. 
   */
  buyerSelectionAnimation?: boolean;

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
  * Minimum width of any image loaded in the browser
  * Default is 1600, best alternatives are 200, 400, 800
  * If you display the Printess editor very small in your website/shop
  * you might want to avoid the editor loading large images into memory. 
  * You can also set **minImageWidth** for certain products with many pages. 
  */
  minImageWidth?: number;

  /**
   * Fires when an template has been opened from the open menu.
   */
  templateOpenedCallback?: (templateName: string, hasPublishedVersion: boolean) => void;

  /**
  * Fires when an template has been saved and published.
  */
  templatePublishedCallback?: (templateName: string) => void;

  /**
   * For every Form Field which is set to **Impact-Price**
   * Printess fires a callback when the value has changed
   */
  formFieldChangedCallback?: externalFormFieldChangeCallback;

  /**
   * Here is the place to draw your properties ui.
   * It gets passed all the current properties and the current scope
   * for the scope "document" means no selected frame and "frames" are selected frames
   */
  selectionChangeCallback?: externalSelectionChangeCallback;

  /**
   * Fired whenever the user has selected a new page/spread and passes snippet-lists and spread-info.
   * Now it's time to redraw **Layout-Snippets** and **Group-Snippets/Stickers**
   */
  spreadChangeCallback?: externalSpreadChangeCallback;

  /**
   * To indicate selectable frames Printess fires this callback where you can 
   * provide a custom div
   */
  getOverlayCallback?: externalGetOverlayCallback;

  /**
   * Arbitary method used to send messages from printess to the web-ui.
   * Current usages:
   *    `topic="SplitterFrameToText" data={}` Indicates that the user has converted a splitter image to a text frame
   *    `topic="ShowAlert",  data.text="The text to display"`  Asks for an alert box to be shown to the user.
  */
  receiveMessageCallback?: receiveMessageCallback;

  /**
   * Is called when the page navigation has changed (and needs redraw) but selection has stayed the same.
   */
  refreshPaginationCallback?: refreshPaginationCallback;

  /**
   * Is called when the undo state has changed (and needs redraw of buttons) 
   */
  refreshUndoRedoCallback?: refreshUndoRedoCallback;

  /**
   * Is called when the page thumbnail has been updated to allow buyer-ui to refresh a particular thumbnail only
   */
  updatePageThumbnailCallback?: updatePageThumbnailCallback;

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

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * Design is automatically saved and function gets a [token] to load or print this design
   */
  saveTemplateCallback?: (saveToken: string, type: "save" | "close") => void,

  /**
   * Provide a callback function which is called when the buyer presses the [Load] button
   * No automatic save is executed before.
   */
  loadTemplateButtonCallback?: () => void,

  /**
   * Provide a callback function which is called whenever the buyer-image-list changed or an image is assigned to a frame
   * Use it, to redraw your buyer-image list if you have one.
   */
  imageListChangeCallback?: () => void,

  /**
   * Height of the printess canvas in pixel below which the current selection is zoomed.
   * Default value is 400. So if the height of printess canvas drops below 400px the frame zoom behaves like on mobile.
   */
  maxHeightForZoomingToFrames?: number,

  /**
   * The public key which is used to verify the used JWT. 
   * Do not touch this parameter when using the Printess public API.
   */
  siginingPublicKey?: string

  /**
   * Activates Printess-Debug-Outputs
   */
  debug?: boolean;

  /**
   * Activate new Text-Area sync for Multi-Line inline editing 
   */
  useTextAreaSyncOnMobile?: boolean,

  /**
   * Labels displayed at stickers which have a price categorie-number set 
   * e.g. ["1,50€","2,50€","3,50€","4,50€","5,50€"]
   */
  snippetPriceCategoryLabels?: Array<string>

  /**
   * Labels displayed at form-fields which have a price tag set
   * e.g. \{
          "mug-front": "+ 2.10 €",
          "mug-back": "+ 2.10 €",
        \}
   */
  priceCategoryLabels?: Record<string, string>

  /**
   * Provide a callback function which is called when an error happens.
   */
  errorCallback?: (errorName: ErrorName, data?: Record<string, string>) => void


  showSplitterGridSizeButton?: boolean,
  showBoxMenuUploadButton?: boolean,

  /**
   * Globally activates image-pixel-size-hints for all templates
   * Is false by default. 
   * (hint is shown close to the upload button)
   */
  showImageSizeHint?: boolean

  /**
   * Enables the save button for all templates
   */
  showSaveButton?: boolean

   /**
   * Enables the load button for all templates
   */
  showLoadButton?: boolean

  /**
   * Enables the save and close button for all templates
   */
  showSaveAndCloseButton?: boolean
}


/**
 * **iPrintessApi** is returned by the ```attachPrintess()``` call and provides you access to the Printess editor. 
 * You can retrieve informations, set properties, add snippets and much more.
 */
export interface iPrintessApi {
  getJson(): string;
  setJson(jsonString: string): Promise<void>;
  getResourcePath(): string;

  /**
   * Load a template to the Printess editor.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save. 
   * @param mergeTemplates optional parameter to pass other templates to merge 
   * @param takeOverFormFieldValues optional parameter to transfer global form field values from previous to next document
   */
  loadTemplate(templateNameOrToken: string, mergeTemplates?: iMergeTemplate[], takeOverFormFieldValues?: boolean): Promise<void>

  /**
   * Loads template first and then exchange state from save-token.
   * @param templateName name of template to load
   * @param saveToken save-token to extract exchange state from 
   * @param publishedVersion optional, default is true.
   */
  loadTemplateWithExchangeToken(templateName: string, saveToken: string, publishedVersion?: boolean = true): Promise<void>

  /**
   * Load a template to the Printess editor and sets form fields.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save. 
   * @param mergeTemplates optional parameter to pass other templates to merge 
   * @param formFields optional parameter to pass global form field values  
   * @param snippetPriceCategoryLabels optional parameter to pass snippetPriceCategoryLabels  
   */
  loadTemplateAndFormFields(templateName: string, mergeTemplates?: iMergeTemplate[], formFields?: { name: string, value: string }[] | null, snippetPriceCategoryLabels?: string[] | null): Promise<void>


  /**
   * Centers the current spread in the printess view container
   */
  centerSpreadInView(): void

  /**
   * @deprecated 
   */
  saveJson(): Promise<string>;
  /**
   * @deprecated
   */
  loadJson(saveToken: string): Promise<void>;

  /**
   * Saves current artwork
   * @returns `saveToken` which you can pass on `attachPrintess()` or `load()`
   */
  save(): Promise<string>;

  /**
   * Loads template or previously saved buyer artwork (`saveToken`)
   * @param templateNameOrSaveToken a templateName or a `saveToken` you have received from basket- or back-callback or from `save()` call
   */
  load(templateNameOrSaveToken: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;


  /**
   * Expects a apreviously saved buyer artwork identified by a saveToken and ensures that this work will never be deleted from DB
   * @param saveToken  
   */
  unexpireJson(saveToken: string): Promise<void>;


  /**
   * Should be called before redirecting to a new template.
   * Will save the current state to the browser storage and apply it automatically to the next loaded template
   * Applies Frame and Document`exchange-ids` as well as template-wide form fields
   * @param frames (default true) add frame exchange-ids (image, text, story)
   * @param documents (default true) add documents with exchange-ids
   * @param formFields  (default true) add all user-defined from fields on template level
   */
  persistExchangeState(frames?: boolean, documents?: boolean, formFields?: boolean): Promise<void>


  /**
   * Method to merge the current document content on another document of the current template
   * @param targetDocId The id of the document to merge on
   * @param frames Which frames should be merged, default to "snippets" which means all frames placed as layout- or sticker-snippet. "all" will delete all frames in the target document before copying over the new frames.
   */
  mergeCurrentDocumentToTargetDocument(targetDocId: string, frames: "all" | "snippets"): Promise<void>

  /**
   * Returns if a real user is logged in - in buyer side only mode with only print option
   */
  userInBuyerSide(): boolean

  /**
   * Logs the current printess user out
   * Not available for buyer-side users!
   * Only if userInBuyerSide() === true
   */
  logout(): void

  /**
   * Returns the add to basket callback you have set in `attachPrintess()`
   */
  getAddToBasketCallback(): null | ((saveToken: string, url: string) => void);

  /**
   * Returns true if the `noBasketThumbnail` flag was set on attach.
   */
  noBasketThumbnail(): boolean

  /**
   * Returns the back button callback you have set in `attachPrintess()`
   */
  getBackButtonCallback(): null | ((saveToken: string) => void);

  /**
   * Returns the save button callback you have set in `attachPrintess()`
   */
  getSaveTemplateCallback(): null | ((saveToken: string, type: "save" | "close") => void);

  /**
    * Returns the `loadTemplateButtonCallback` you have set in `attachPrintess()`
    */
  getLoadTemplateButtonCallback(): null | (() => void);

  /**
   * Returns true if the ui should show a "load" button.
   */
  showLoadButton(): boolean

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
   * Get frames available on spread.
   * Return first editable frame.
   */
  getFrameUiHintPosition(): Promise<iExternalFrame>

  /**
   * Select and zoom to the frame(s) mentioned in the error object.
   * @param err
   */
  bringErrorIntoView(err: iExternalError): Promise<void>

  /**
   * For off-canvas displays of to many frame properties. Determines if the property is suitable to be displayed off canvas.
   * @param p the property to look for
   */
  isOffCanvasProperty(p: iExternalProperty): boolean

  /**
   * Indicates if a selected image frame can be splitted in certain directions
   */
  hasScissorMenu(): "never" | "horizontical" | "vertical" | "both"

  /**
   * Indicates if a splitter cell is selected
   */
  hasSplitterMenu(): boolean 
  
  /**
   * Indicates if a splitter cell is selected
   */
  hasSplitterTextSnippets(): boolean

  /**
   * number of active splitter edges 
   */
  splitterEdgesCount(): number

  /**
   * Indicate if the template has static image filters to diplay, like AI-enhancement for example
   */
  hasStaticImageFilters(): boolean

  /**
   * Split an image frame that has splitter option turned on
   * @param direction is either horizontal or vertical depending on how an image should be splitted
   */
  splitFrame(direction: "horizontal" | "vertical"): Promise<void>

  /**
   * Selects all frames which are marked as **background**
   */
  selectBackground(): Promise<void>;

  /**
   * Indicates if the current spread has editable background frames
   */
  hasBackground(): boolean

  /**
   * Indicates if background frames are selected
   */
  isBackgroundSelected(): boolean

  /**
   * Selects a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part`parameter.
   * @param spreadIndex zero-based 
   * @param part  "entire" | "left-page" | "right-page"
   */
  selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Selects a document and a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part`parameter.
   * @param docId ID of document to select  
   * @param spreadIndex zero-based 
   * @param part  "entire" | "left-page" | "right-page"
   */
  selectDocumentAndSpread(docId: string, spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Retrieves current documen id, returns empty string if doc is not yet loaded.
   */
  getCurrentDocumentId(): string

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
  pageInfo(): Promise<{ current: number, max: number, isFirst: boolean, isLast: boolean, spreadId: string }>


  /**
   * Retrieves information about the currently selected page. 
   * Returns natural page-number (current) staring from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents. 
   * Sync version returns dummy data if Printess is not fully loaded.
   */
  pageInfoSync(): { current: number, max: number, isFirst: boolean, isLast: boolean, spreadId: string }

  /**
   * Returns information about all spreads of the displayed document  
   */
  getAllSpreads(): Array<iExternalSpreadInfo>;

  /**
   * Returns information about all spreads of ALL buyer-editable documents
   */
  getAllDocsAndSpreads(): Array<iExternalDocAndSpreadInfo>;

  /**
   * Returns total number of spreads (not pages)
   */
  spreadCount(): number

  /**
   * On IOS returns if iphone has its keyboard expanded. 
   * This can never be 100% accurate.
   */
  isSoftwareKeyBoardExpanded(): boolean

  /**
  * Returns true is the user has made edits on a spread.
  * @param spreadIdOrIndex: ID or Index of Spread to check for - if empty it checks for current spread
  */
  hasBuyerContentEdits(spreadIdOrIndex?: string | number, documentName?: string): boolean

  /**
   * Returns only false if property refers to a formfield which is not visible, because it doesn' match a specific condition.
   * @param propertyId ID of property to check
   */
  isPropertyVisible(propertyId: string, wasVisibleBefore?: boolean): boolean

  /**
   * Returns all available properties in teh current document
   */
  getAllProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
   * Returns the name of a form field if property-id points to an existing form field  
   * @param properyId External Property ID
   */
  getFormFieldNameByExternalPropertyId(properyId: string): string | null

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
  getMobileUiButtons(properties: Array<iExternalProperty>, propertyIdFilter: "all" | "root" | string, customHandwriting?: boolean): Array<iMobileUIButton>;

  /**
   * Returns change background button if available
   */
  getMobileUiBackgroundButton(): Array<iMobileUIButton>

  /**
   * Returns change layouts button for splitter text frames
   */
  getMobileUiSplitterLayoutsButton(): Array<iMobileUIButton>

  /**
   * Returns grid gap button for splitter frames
   */
  getMobileUiSplitterGapButton(): Array<iMobileUIButton>

  /**
  * Returns image to text convert button if available
  */
  getMobileUiSplitterToTextButton(): Array<iMobileUIButton>

  /**
   * Returns text to image convert button if available
   */
  getMobileUiSplitterToImageButton(): Array<iMobileUIButton>

  /**
   * Mobile UI helper method to go through a table form-field which is set as data-source in the template
   * @param type up or down for arrow/data direction
   */
  getMobileUiRecordNavigationArrows(): Array<iMobileUIButton>

  /**
   * Returns horizontal and vertical scissor buttons if available
   */
  getMobileUiScissorsButtons(): Array<iMobileUIButton>

  /**
   * Mobile UI helper method to get model to draw a circle button including icons, gauge, etc.
   * uiHelper.js contains a method to create an SVG from this circle model
   * @param m The mobile button to create a circle for
   * @param isSelected If the button is selected
   */
  getButtonCircleModel(m: iMobileUIButton, isSelected: boolean, customHandwriting?: boolean, customSplitterButton?: boolean, customTableRecordButton?: boolean): iButtonCircle

  /**
   * Returns a simple ui to change the postion of an image 
   * @param propertyId
   * @param forDesktopDialog give more space if for desktop dialog
   */
  createCropUi(propertyId: string, forDesktopDialog: boolean): null | { container: HTMLDivElement, setScale: (s: number) => void, getCropBox(): { top: number, left: number, width: number, height: number } }

  /**
   * Creates a new cropped image and assigns it to the passed form-field. Takes the currently assigned image as master
   * @param propertyId id of a form-field-property (type of image-id) pointing to a valid image 
   * @param box all box coordinates are expected to be in the range of 0 to 1 
   */
  cropImage(propertyId: string, box: { left: number, top: number, width: number, height: number }): Promise<iExternalImage | null>

  /**
   * Returns if a iMobileUIButton should display text instead of an icon
   */
  isTextButton(m: iMobileUIButton): boolean


  /**
   * Returns if property is a form field of type font
   * @param propertyId 
   */
  isFontFormField(propertyId: string): Promise<boolean>;


  /**
   * Sets the value of any top-level property passed to the external UI
   * @param propertyId 
   * @param propertyValue Must be string and will be converted if neccessary
   */
  setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void | (iExternalImageScaleHints & { scale: number })>; // | Array<iExternalColorUpdate>>;

  /**
   * Sets the value of a form field
   * @param fieldNameOrId Name of the Form-Field or Form-Field Property-ID
   * @param newValue Must be string and will be converted if neccessary
   */
  setFormFieldValue(fieldName: string, newValue: string): Promise<void>;

  /**
   * Sets the spine width, colud be any Length value, like an equation or a fixed value with unit.
   * @param formular like `=spine.pages * 0.3mm` or just `2cm`
   */
  setSpineFormular(formular: string): Promise<void>


  /**
   * updates a specific cell of a form field of type "table"
   * Any then all other updates, 
   * this will NOT trigger a selection change event on buyer side 
   */
  setTableCell(fieldNameOrId: string, rowIndex: number, col: iExternalTableColumn, value: string | number | boolean): Promise<iExternalError | null>

  /**
   * Adds a new row to a table form field.
   * Returns row-index of added row.
   * @param fieldNameOrId The property-id or a form-field-name or form-field-id 
   * @param type each form field table should have a type column which can be set on insert.
   */
  addTableRow(fieldNameOrId: string, type: string): number | null

  /**
   * Returns the row-indizies of a table form field to add to another table form field.
   * An array of those indizies can be passed to 'addTableRows()'
   * @param ffName Form Field Name
   */
  getTableRowsToAdd(ffName: string): Array<{ index: number, label: string }>

  /**
 * Adds multiple table rows at once from another table from field
 *  * Returns row-index of added row.
 * @param fieldNameOrId The property-id or a form-field-name or form-field-id 
 * @param type each form field table should have a type column which can be set on insert.
 * @param ffLibName Name of form-field which contains row-library
 * @param libIndizies list if row-indizies of row-library
 */
  addTableRows(fieldNameOrId: string, type: string, ffLibName: string, libIndizies: Array<number>): number | null

  /**
   * Sets the size of a specific document 
   * @param documentName Name of the document to change
   * @param widthInDocUnit 12 equals e.g. "12cm"
   * @param heightInDocUnit 12 equals e.g. "12cm"
   */
  setDocumentSize(documentName: string, widthInDocUnit: number, heightInDocUnit: number): Promise<void>

  /**
   * removes image for rich-text-frames which have a handwriting image set
   * Sets back to text
   */
  removeHandwritingImage(): Promise<boolean>;

  /**
   * Indicates if form fields are available
   */
  hasFormFields(): boolean

  /**
   * Get the id if the tab to display on start-up
   * default is `#PHOTOS`
   */
  getInitialTabId(): string 
  
  /**
   * Returns passed tab-id or initial tab id if current is invalid
   */
  validateCurrentTabId(curTabId: string): string

  /**
   * If Tab-Navigation is enabled, this method tells if a "PHOTO" tab makes sense.
   */
  showPhotoTab(): boolean

  /**
   * Returns the current form field value and its possible list values if available
   * @param fieldName Name of the Form-Field or Form-Field Property-ID
   */
  getFormField(fieldName: string): Promise<{
    value: null | string | number | Array<Record<string, any>>,
    list?: Array<{
      key: string,
      label?: string,
      description?: string,
      imageId?: string
    }>
  } | undefined>


  /**
   * Returns name/value-list only from table form field
   * @param ffName Name of FormField
   */
  getTableSelectListByFormFieldName(ffName: string): Array<{ value: string, label: string }> | null

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
   * Replaces multi-line text only works with a current active multi-line-text-editor
   * @param text The text to insert in to the active multi-line editor
   */
  setEditorText(text: string): boolean

  /**
   * Method to set a text style meta-property
   * @param propertyId 
   * @param name 
   * @param value 
   * @param textStyleMode 
   */
  setTextStyleProperty(propertyId: string, name: "font" | "color" | "size" | "hAlign" | "vAlign" | "pStyle", value: string, textStyleMode?: textStyleModeEnum): Promise<void>;

  /**
   * Method to set an image meta-property
   * Set the image itself via `setProperty()`
   * @param propertyId 
   * @param name 
   * @param value 
   */
  setImageMetaProperty(propertyId: string, name: "scale" | "sepia" | "brightness" | "saturate" | "invert" | "contrast" | "grayscale" | "vivid" | "hueRotate", value: string | number): Promise<void>;

  /**
   * Resets all image filters (meta-values) of an image-property to default
   * @param propertyId 
   * @param imageMeta optional parameter, can be used to set all image-filters to specific values.
   */
  resetImageFilters(
    propertyId: string,
    imageMeta?: {
      brightness?: number,
      sepia?: number,
      invert?: number,
      hueRotate?: number,
      contrast?: number,
      vivid?: number
    }): Promise<void>;


  /**
   * Uploads one or many images to Printess and auto assigns the first image if an image frame is selected
   * If no frame is selected it distributes to the next possible frame or
   * automatically distributes all images depending on the template settings 
   * @param files 
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
   * @param progressCallback 
   * @param isHandwritingImage Toggle the current textframe to handwriting mode und assigns image
   */
  uploadAndDistributeImages(files: FileList | null, propertyId: string, progressCallback?: (percent: number, state: "upload" | "optimization") => void, isHandwritingImage?: boolean): Promise<iExternalImage[]>;

  /**
   * Uploads one or many images to Printess and can auto assign the first image 
   * @deprecated Its deprecated, because buyer side never create frames on image upload. Just via stickers, use uploadAndDistributeImages() instead
   * @param files 
   * @param progressCallback 
   * @param assignToFrameOrNewFrame Auto assigns the first image to the current slection or a specific frame
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
   */
  uploadImages(files: FileList | null, progressCallback?: (percent: number, state?: "upload" | "optimization") => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage[]>;

  /**
   * Uploads a single image to Printess and can auto assign this image
   * @deprecated Its deprecated, because buyer side never create frames on image upload. Just via stickers
   * @param file 
   * @param progressCallback 
   * @param assignToFrameOrNewFrame 
   * @param propertyId 
   */
  uploadImage(file: File, progressCallback?: (percent: number, state?: "upload" | "optimization") => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  /**
   * If no selection is present this call finds the first unassigned image and assigns it
   * If all images are already assigned it takes the first image and re-assigns it
   */
  assignImageToNextPossibleFrame(imgId: string): Promise<boolean>

  /**
   * Check if image zoom is allowed
   * @param propertyId 
   */
  canScale(propertyId: string): boolean;

  /**
   * Rotates an image by 90deg and saves the result as new image and assigns rotated image to frame automatically.
   * @param propertyId 
   * @param angle 
   */
  rotateImage(propertyId: string, angle: "0" | "90" | "180" | "270"): Promise<iExternalImage | null>;

  /**
  * Imports a single image to Printess and can auto assign this image
  * @param url The url to the image you want to import to Printess.
  * @param assignToFrameOrNewFrame Assign this image to the current frame, or create a new frame in case none is selected.
  * @param propertyId 
  */
  importImageFromUrl(url: string, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  getSerializedImage(imageId: string): string | null;
  addSerializedImage(imageJson: string, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage>;

  importImagesFromExternal(images: iImage[], assignToFrameOrNewFrame: boolean = false): Promise<iExternalImage[]>;

  /**
   * Returns not null if buyer should be able to use generative ai image creation
   */
  showText2Image(): null | { selectStyle: boolean, prompt: string, defaultPrompt: string, style: SdxlStyle | null, allowUpload: boolean }

  /**
   * Returns list of available SDXL Styles 
   */
  getText2ImageStyles(): Array<string>

  /**
   * Creates an images based on a prompt and style and uploads & assigns it to current frame. 
   * @param prompt 
   * @param style
   */
  createText2Image(prompt: string, style: SdxlStyle): Promise<void>

  /**
   * Sets image placement based on selection, can only handle a single selected image for now.
   * TODO: Support for propertyId will follow
   */
  setImagePlacement(which: "fit" | "fill" | "face" | "group", propertyId?: string): Promise<void | (iExternalImageScaleHints & { scale: number })>


  /**
   * Returns Buyer-Side Flag if ui should show left tab bar
   */
  showTabNavigation(): boolean;

  /**
   * Returns Buyer-Side Flag if ui should show bottom tab bar on mobile
   */
  showMobileTabNavigation(): boolean;

  /**
   * Indicates if a Layouts Dialog should be displayed when initially opening the Buyer Side to choose a Layout Snippet
   */
  showLayoutsDialog(): boolean;

  /**
   * Indicates if a Layouts Tab should be auto selected;
   */
  selectLayoutsTabOneTime(): boolean;

  /**
   * Returns how many columns a Change Layout overview should have to display layout snippets more properly
   */
  numberOfColumns(): number;

  /**
   * Returns if buyer is allowed to upload pdf files
   */
  allowPdfUpload(): boolean;

  /**
   * Returns if buyer is only allowed to upload vector (svg) files
   */
  allowOnlyVectorImageUpload(): boolean;

  /**
   * automatically distribute all non used uploaded images to frames which have not been assigned yet.
   * Returns a list of all applied image-ids.
   */
  distributeImages(): Promise<Array<string>>

  /**
   * check number of distributable image boxes 
   * if greater than 1 return true
   */
  allowImageDistribution(): boolean

  /**
   * Tells UI to always show image distribution button.
   */
  showImageDistributionButton(): boolean

  /**
   * returns true if a single frame with buyer side image upload allow is selected
   */
  currentSelectionAllowsImageUpload(): boolean

  /**
   * Tells UI to resize an image in the "My Photos" tab to fit within the bounds of its container with no cropping ("fit")
   * or to expand an image to fill the whole container potentially with cropping ("fill")
   */
  getImageThumbFitProperty(): "fill" | "fit"

  /**
   * Tells UI to display upload button for image upload from mobile phone.
   */
  showMobileUploadButton(): boolean

  /**
   * get a QR Code for uploading images on mobile phone
   */
  createExternalImageUploadChannel(): Promise<{ qr: HTMLImageElement, channelId: string }>

  /**
   * check for images uploaded from phone
   * @param channeldId 
   */
  startExternalImagePolling(channeldId: string): Promise<void>

  /**
   * delete buyer uploaded images that are not in use
   * Returns the number of successfully deleted images.
   * @param images array of images to be deleted
   */
  deleteImages(images: Array<iExternalImage>): number

  /**
   * If property is empty it returns the list of buyer uploaded images.
   * @param propertyId id of property which shows the image list
   */
  getImages(propertyId?: string): Array<iExternalImage>

  /**
   * Returns all buyer uploaded images including information if the image is in use
   */
  getAllImages(): Array<iExternalImage>

  /**
   * Returns all available image groups
   * @param propertyId id of property which shows the image list
   */
  getImageGroups(propertyId?: string): Array<string>

  /**
   * Returns image-count in "Buyer Upload" folder.
   */
  getUploadedImagesCount(): number

  /**
   * When using direct upload, this will return the count of outstanding image uploads.
   */
  getPendingImageUploadsCount(): number

  /**
   * Returns if an externalProperty resolves to multiple mobile-ui-buttons
   * @param p 
   */
  hasMetaProperties(p: iExternalProperty): boolean

  /**
   * Returns if a specific image is used in buyer editable frame.
   * @param imageId Id of image to test
   */
  isImageInUse(imageId: string): boolean

  /**
   * Retrieves a list of available font-sizes in point 
   */
  getFontSizesInPt(): Array<number>

  /**
   * Returns a list of available fonts for a certain selected property (frame).
   * @param propertyId Id of property to filter available fonts per frame
   */
  getFonts(propertyId: string): Array<{
    name: string;
    thumbUrl: string;
    displayName: string;
    familyName: string;
    weight: number;
    isItalic: boolean;
  }>;

  /**
   * Returns a list of available colors for a certain selected property (frame).
   * @param propertyId Id of property to filter available color per frame
   */
  getColors(propertyId: string): Array<{
    name: string;
    color: string;
  }>;

  showColorDialog(p: iExternalProperty): Promise<iExternalColor | null>

  getColorInfo(p: iExternalProperty): iExternalColor | null

  /**
   * Returns a list of available paragraph-style for a certain selected property (frame).
   * @param propertyId Id of property to filter available styles per frame
   */
  getParagraphStyles(propertyId: string): Array<{
    class: string,
    css: string
  }>;

  /**
   * Returns hex color from rgb value
   * @param color rgb color value
   */
  getHexColor(color: string): string

  /**
   * Returns black or white hex depending on color value
   */
  invertColor(hex: string, bw: boolean): string

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
  resizePrintess(immediate?: boolean, focusSelection?: boolean, width?: number, height?: number, focusFormFieldId?: string): void;

  resizePrintessExact(immediate: boolean, focusSelection: boolean, size: iRect, focusFormFieldId?: string): Promise<void> 

  getTemplateTitle(): string;

  /**
   * Get the link required for displaying an info icon that opens a product info overlay / dialog
   */
  getProductInfoUrl(): string;

  /**
   * Insert a Layout-Snippet on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   * @param targetPage optional, forces layout-snippets to left or right side if aspect ratio of snippet matches dimensions a single page of a double page spread
   */
  insertLayoutSnippet(snippetUrl: string, targetPage?: "left" | "right"): Promise<void>;

  /**
   * Insert a Sticker (Group-Snippet) on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   */
  insertGroupSnippet(snippetUrl: string): Promise<void>;

  /**
   * Load a list of layout snippets which can be used during photo-book spread insertion
   */
  getInsertSpreadSnippets(): Promise<Array<iExternalSnippet>>


  /**
   * Get a list of all splitter-snippets (single frame only) having any of the provided tags
   */
  getSplitterSnippets(): Promise<Array<iExternalSnippet>>

  /**
   * Replaces current splitter-cell with splitter-snippet content 
   */
  applySplitterCellSnippet(splitterSnippetUrl: string): Promise<void>


  /**
   * Get a list of all image-filter-snippets having any of the provided tags
   */
  getImageFilterSnippets(tags: Array<string> | ReadonlyArray<string>): Promise<Array<iExternalSnippet>>

  /**
   * Applies image-filter-snippet to selected image
   */
  applyImageFilterSnippet(filterSnippetUrl: string): Promise<void>


  /**
   * Insert a docuement from any template like a layout-snippet or group-snippet (sticker) to the current document/spread
   * This method comes in handy if you have your own snippet-management in place.
   * Any template can be inserted (Does not have to be published as snippet), 
   * but if the template/document is a snippet the placement-settings will be used
   * @param mode: Optional, default is "layout" setting to "group" will insert template/document as sticker (group-snippet) 
   */
  insertTemplateAsLayoutSnippet(templateName: string, templateVersion: "draft" | "published", documentName: string, mode: "layout" | "group"): Promise<void>


  /**
   * Saves and publishes the template.
   * @param name The name you want to save the template under.
   */
  saveAndPublish(name: string): Promise<void>;

  /**
   * returns an array of uiHints to be displayed on buyer side.
   */
  uiHintsDisplay(): Array<"splitterGuide" | "layoutSnippets" | "groupSnippets" | "editableFrames" | "expertMode">;

  /**
   * @deprecated
   * Returns if buyer ui should display the page navigation
   */
  showPageNavigation(): boolean;

  /**
   * Returns if buyer ui should display the page navigation as icons for all docs or just numbers for current doc
   */
  pageNavigationDisplay(): "hide" | "numbers" | "icons" | "doc-tabs";

  /**
   * Returns if buyer ui should display the search bar for searching through images
   */
  showSearchBar(): boolean

  /**
   * Returns if buyer ui should display option for custom colors in color dropdown
   */
  enableCustomColors(): boolean

  /**
   * Returns if buyer ui should display undo and redo buttons
   */
  showUndoRedo(): boolean

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

  /**
   * return if zoom options should be displayed
   */
  allowZoomOptions(): boolean

  /**
   * Zoom in on spread visible
   */
  zoomIn(): void

  /**
   * Zoom out of spread visible
   */
  zoomOut(): void

  /**
   * Check for double page spreads to show/hide zoom to spread option
   */
  isDoublePageSpread(): boolean

  /**
   * Returns if the number of spreads fits the requirements set in the template
   * @param spreadSize current number of spreads 
   */
  isNoOfPagesValid(spreadSize: number): boolean

  /**
   * Book-Inside-Pages only feature:
   * re arranges all spreads by a given array of ids or "newSpread"
   * 
   * `id`: either current spread id or "newSpread"
   * 
   * `snippetUrl` (optional): Layout Snippet, which is inserted on the new spread
   * 
   * example:
   * 
   * ```
   * await api.reArrangeSpreads([
   *  {
   *    id: "PZE4tKlZmD9Mx9gZ0OIfx" // existing spread
   *  },
   *  {
   *    id: "newSpread", 
   *    snippetUrl: "
https://printess-prod.s3.eu-central-1.amazonaws.com/uploads/snippet/fc8b773be98ee6d58ffebd9d955a55252ddc9a0a/json/764f973bb7d9a0ae9691c3d62cf941baac6cd13e/91b02c876e345bdc8efe5d4582519a85dfc3726d.json?DOC=PCepmgRyO8E3vz0f7rXlh&ID=40be80b32d36fd85d3127f7258ead6b1dbcb8458"
      },
      {
        id: "PRE4tKlZmD4jj9gZ0OIfx" // existing spread
      }
   * ])
   * ```
   * 
   * Handle with care, this can destroy your Book-Inside-Pages document
   * @param newSpreadIds Array of spread id or "newSpread" and optional snippetUrls for all "newSpreads" in correct order
   */
  reArrangeSpreads(newSpreadIds: Array<{ id: string | "newSpread", snippetUrl: string }>): Promise<boolean>

  /**
   * Returns how many spreads would be added before the back cover if `addSpreads()`is called. 
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spreadSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   */
  canAddSpreads(spreadSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Add new spreads / pages to the current document before the back cover 
   * The amount depends on the settings in the template. Template needs to be marked as `book`
  */
  addSpreads(): Promise<boolean>

  /**
   * Returns how many spreads would be removed before cover  `removeSpreads()`is called. 
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spreadSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   */
  canRemoveSpreads(spraedSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Remove spreads / pages from the current document before the back cover 
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   */
  removeSpreads(): Promise<boolean>

  /**
   * Tells if user is allowed to duplicate the current spread
   */
  canDuplicateSpread(): boolean

  /**
   * Duplicates the currently selected spread
   */
  duplicateSpread(): Promise<void>

  /**
   * Gets the state of the "lockCoverInside" user setting in "book" mode
   * If set to true the cover extends to two spreads when adding or removing spreads
   */
  lockCoverInside(): boolean

  /**
   * 
   * @param fileName deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   */
  renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;


  /**
   * Renders all pages as images for the given document. 
   * 
   * 
   * @param fileNameSuffix deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   * @returns Array of urls to the images. They can be png with tranparency or jpg. 
   */
  renderPageImages(fileNameSuffix: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string[]>;

  isMobile(): boolean;

  // check if device is iPhone or iPod
  isIPhone(): boolean;

  /**
   * Tells if printess has currently selected frames
   */
  hasSelection(): boolean

  getStep(): iBuyerStep | null;
  /**
   * Indicates if the current step has become inactive, because the user has selected other frames 
   * TRUE if the current step is part of the selection.
   */
  isCurrentStepActive(): boolean;

  /**
   * Returns step information
   * @param index 
   */
  getStepByIndex(index: number): iBuyerStep | null

  /**
   * Indicates if the current template has buyer-steps 
   */
  hasSteps(): boolean

  /**
   * 
   * @param index Sets step by index
   * @param zoom 
   */
  setStep(index: number, zoom?: "frame" | "spread"): Promise<void>

  /**
   * Retrieves last step
   */
  lastStep(): iBuyerStep | null;

  /**
   * Returns true if a next step is available
   */
  hasNextStep(): boolean;

  /**
   * Returns true if a previous step is availabel
   */
  hasPreviousStep(): boolean;

  /**
   * Indicates if the next step is the preview document.
   */
  isNextStepPreview(): boolean;

  /**
   * Return true if buyer can deselect an item on the current spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers 
   * Important to keep buyer in the step-logic
   */
  buyerCanHaveEmptySelection(): boolean;

  /** 
   * returns desired behaviour of basket button  
   * In steps-mode basket button always points to the basket. 
   * If no steps are present basket button should lead to the preview
   */
  getBasketButtonBehaviour(): "add-to-basket" | "go-to-preview"

  /**
   * Tells the ui if it should a `Back-Button`from preview to edit.
   * Its true if the current displayed document is a `preview` document 
   */
  hasPreviewBackButton(): boolean


  /**
   * Jumps to the previous available preview document if there is one.
   */
  gotoPreviousPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Jumps to the next available preview document if there is one.
   */
  gotoNextPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Retrieves information if the device is mobile or the screen is so small that zoom to frames is needed 
   */
  zoomToFrames(): boolean

  /**
   * Tells printess the zoom mode to use for the next resize operation
   * `spread` zooms to the entire page
   * `frame`zooms to the selected frame(s)
   */
  setZoomMode(m: "spread" | "frame"): void

  /**
   * Retrieves the current zoomMode (see `setZoomMode()`)
   */
  getZoomMode(): "spread" | "frame"


  /**
   * Tells if the current selection can be moved around by the user 
   */
  canMoveSelectedFrames(): boolean

  /**
   * Tells if the current selection is part of a collage and accordingly influences the size of other images and own size when changing
   */
  canSplitSelectedFrames(): boolean

  /**
   * Change an image frame to a text snippet frame in a photo collage
   */
  convertSplitterCellToText(): Promise<void>

  /**
   * Change a text snippet frame to an image frame in a photo collage
   */
  convertSplitterCellToImage(): Promise<void>

  /**
   * Set the gap size of the photo grid
   * @param n gap size of the photo grid
   */
  setSplitterGaps(n: number): void

  /**
   * Returns if splitter layout has gap around
   */
  hasGapAround(): boolean

  /**
   * If splitter frames are present on current spread this method adds
   * a gap between all splitter-frames and the page border
   * Returns `true` if succesfull
   */
  addGapAround(): Promise<boolean>

  /**
   * If splitter frames are present on current spread this method removes
   * the gap between all splitter-frames and the page border
   *  * Returns `true` if succesfull
   */
  removeGapAround(): Promise<boolean>

  /**
   * Returns `true` if either rich- or simple-text-editor is currently active
   */
  isTextEditorOpen(): boolean

  /**
   * Open rich- or simple-text-editor
   */
  showTextEditor(): void

  /**
   * Returns `true` if either rich- or simple-text-editing is allowed (text-content is turned on)
   */
  showEnterTextEditorButton(): boolean

  /**
   * Returns true if text styles should have a caption
   */
  showTextStyleCaptions(): boolean

  /**
   * Goes to the next available step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   */
  nextStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns true if current doc is a 3D Preview
   */
  is3dPreviewSelected(): boolean

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
  gotoPreviewStep(previewIndex?: number, zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the first step, helpful if you want to exit the preview step.
   * @param zoom overrides the frames zoom settings for all devices
   */
  gotoFirstStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the last step, helpful if you want to skip steps.
   * @param zoom overrides the frames zoom settings for all devices
   */
  gotoLastStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Turns the display of step numbers on or off
   */
  displayStepNumbers(display: boolean): Promise<void>

  /**
   * Returns if step numbers are displayed 
   */
  stepNumbersDisplayed(): boolean

  /**
   * Returns the template settings for display of steps header on desktop and mobile
   */
  stepHeaderDisplay(): "never" | "only title" | "only badge" | "title and badge" | "badge list" | "tabs list"

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
   * Returns status of config-flag `neverHideMobileToolbar`, default is false.
   */
  neverHideMobileToolbar(): boolean

  /**
   * @deprecated
   * Returns true if `autoScale` was set in `attachPrintess` call
   */
  autoScaleEnabled(): boolean

  /**
   * Retrieves information if the `auto-scale` option was enabled on `attachPrintess()` 
   * Also returns the calculated pixel-dimension of printess container on desktop
   */
  autoScaleDetails(): { enabled: boolean, width: number, height: number }

  centerSelection(focusFormFieldId?: string, forceZoom?: "spread" | "frame"): Promise<void>

  /**
   * 
   * @param uploadEndpoint The target address to send the upload form data to. E.g. https://your-bucket.s3.eu-central-1.amazonaws.com/ 
   * @param serveEndpoint The url the files are served from. This can differ from the upload endpoint to make CDN distribution possible. E.g. https://mycloudfrontid.amazonaws.com/
   * @param keyGenerator The method to generate the S3 key. The built-in one just makes sure that the file name is unique per session.
   */
  createAwsUploaderProvider(uploadEndpoint: string, serveEndpoint?: string, keyGenerator?: (fileName: string, fileHash: string) => string): AwsUploadProvider;

  /**
   * @deprecated
   */
  getContentEditables(): TemplateEditables;

  /**
   * Retrieves all price relevant form-field names and values
   */
  getAllPriceRelevantFormFields(): { [key: string]: string }

  /**
   * Retrieves all price relevant form-fields plus tag information and referenced price-categories
   */
  getAllPriceRelevantFormFieldsExt(): { priceCategories: Array<string>, formFields: { [key: string]: { value: string, tag: string, label: string } } }

  /**
   * Returns all default english translations or if language property is set / browser language is detected (if set to auto) the respective translation if available
   */
  //  getTranslations(): Record<string, Record<string, string | number> | string | number>;

  /**
   * @deprecated please use async version instead, to ensure open text editors are saved
   * Returns an array of external property errors that can be used to display errors like missing text to the customer
   * @param mode Specifies when and up to which point the validation should be done.
   */
  validate(mode?: "all" | "until-current-step" | "selection"): Array<iExternalError>

  /**
   * Closes open editors and returns an array of external property errors 
   * that can be used to display errors like missing text to the customer
   * @param mode Specifies when and up to which point the validation should be done.
   */
  validateAsync(mode?: "all" | "until-current-step" | "selection"): Promise<Array<iExternalError>>


  /**
   * Returns true if the associated mutli-line text-frame has text which does not fit into the frame
   * @param propertyId 
   */
  hasTextOverflow(propertyId: string): boolean

  /**
   * Returns short language code in lower case, like "en" or "de" 
   */
  languageShort(): string

  /**
   * Returns long language code if available. Otherwise returns short code like `languageShort()`.
   * Format: lower case main language + sub language in upper case, like "en-GB" or "de-DE" 
   */
  languageLong(): string

  /**
   * Returns a translation as string to display the ui in different languages
   * @param translationKey String containing the keys for the translation table separated by period
   * @param params String or number parameters that substitute $1, ..., $9 properties in a translation
   */
  gl(translationKey: string, ...params: Array<string | number>): string

  /**
   * Returns current global scale factor, should be !== 1 only on iOS devices to avoid safari-crashes
   */
  globalScaleFactor(): number

  /**
   * Returns if LayoutSnippets are available
   */
  hasLayoutSnippets(): boolean,

  /**
    * Returns if sticker or layout snippet menus should be rendered
    */
  hasSnippetMenu(which: "layout" | "sticker"): boolean

  /**
    * Returns if LayoutSnippets are available
    */
  getDocumentAspectRatioName(): string

  /**
   * Returns the recommended upload size of the currently selected image
   */
  getSelectedImageRecommendedSize(): null | { pxWidth: number, pxHeight: number }

  /** @deprecated */
  getLayoutSnippetFilterMenu(): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns Filter Menu for Layout Snippets ("layout") or for a menu-id passed in "which"    
   */
  getSnippetFilterMenu(menuId: "layout" | string): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns if ui should show image count filter for layou snippets
   * Only active if filter menu is displayed
   */
  hasLayoutSnippetImageCountFilter(): boolean

  /**
   * Retrieved availbale keywords for layout search
   */
  getLayoutSnippetKeywords(): Promise<Array<string>>

  /**
   * Retrieved all layout snippets matching certain keyword, current language and current aspect ratio
   */
  loadLayoutSnippetsByKeywords(keywords: string[], topicId?: string): Promise<Array<iExternalSnippet>>

  /**
   * Retrieved all stickersnippets mathcing certain tags & keywords and current language
   */
  loadStickerSnippetsByKeywords(tags: string[] | ReadonlyArray<string>, keywords: string[]): Promise<Array<iExternalSnippet>>

  /** only for internal use, to transfer visual-viewport to iOs in iframe-mode */
  setIFrameViewPort(v: { offsetTop: number, height: number }): void

  /**
   * Enter the buyer Expert-Mode to allow position, remove and rotation for every frame which is not locked
   */
  enterExpertMode(): void

  /**
   * Leave the buyer Expert-Mode to allow position, remove and rotation for every frame which is not locked
   */
  leaveExpertMode(): void

  /**
   * Returns if Expert-Mode is active
   */
  isInExpertMode(): boolean
  /**
   * Returns if UI should show a button to enter Expert-Mode
   */
  hasExpertButton(): boolean

  /**
   * Returns if UI should display a button to save the current work in the buyer side
   */
  showSaveButton(): boolean

  /**
   * Returns if UI should display a button to save and close the current work in the buyer side
   */
  showSaveAndCloseButton(): boolean

  /**
   * Returns if UI should display a button to add current work into the basket
   */
  showAddToBasketButton(): boolean

  /** 
   * Indicates if UI should show an alert prompt when user attempts to leave the buyer-side 
   */
  showAlertOnClose(): boolean

  /**
   * tells if the propertyId refers to
   * a table form-field which is set as data-source in the template
   */
  isDataSource(propertyId: string): boolean

  /**
   * Sets the selected index of the primary data-source if the propertyId refers to
   * a table form-field which is set as data-source in the template
   * @param propertyId id of a table property
   * @param index current row-index to select
   */
  setTableRowIndex(propertyId: string, index: number): void

  /**
   * Retrieves the current row index for a table-property 
   * if table is set to be data-source of template the call returns current data-index 
   * @param propertyId  id of a table property
   */
  getTableRowIndex(propertyId: string): number


  /**
   * @deprecated 
   * This call is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
   * This call will no longer return `iFrameCountAndClasses` intead it returns `iFrameCountAndMarkers`
   */
  getBuyerFrameCountAndClasses(): Array<iFrameCountAndMarkers>


  /**
   * Returns an array of buyer-editable documents and a list of frames for each spread including their frame markers.
   * You can easily use them for statistically purposes or to charge extra prices for certain used layouts.
   * Or just use the frame-count to determine if the user had made changes at all. 
   */
  getBuyerFrameCountAndMarkers(): Array<iFrameCountAndMarkers>

  /**
   * Get price labels for form-field badges from price-tags
   * @param tag
   * @param propertyId optional to allow printess to check price-relevance of form field
   */
  getFormFieldPriceLabelByTag(tag: string, propertyId?: string): string

  /**
   * When using direct upload, this will return all the pending image upload promises.
   * You can use Promise.any() to show some nice progress.
   * 
   * @returns The currently pending upload promises for direct upload.
   */
  getPendingImageUploads(): Set<Promise<any>>;

  /**
   * When using direct upload, this will return all the image meta data finalization promises.
   * 
   * @returns The currently pending metadata promises for direct upload.
   */
  getDirectImageMetadataFinalizationPromises(): Set<Promise<any>>;

  /**
   * When using direct upload, this returns the count of upload processes.
   * 
   * @returns The number of upload processes.
   */
  getUploadsInProgress(): number;



  streamPrompt(prompt: string, onMessage: (message: string) => void, onFinished: () => void): void;
  loadLetterGeneratorState(): Promise<LetterState | undefined>;

  /** Provides access to the sample date of the template */
  getSamplePriceData(): { priceTestModeEnabled: boolean, legalNotice: string, oldPrice: number, snippetPrices: Array<number>, priceCategories: { [key: string]: number }, basePrice: number, infoUrl: string }
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
  keyGenerator: (fileName: string, fileHash: string) => string;
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
  /**
   * ID of the spreads document
   */
  docId: string;
  /**
   * ID of the spread
   */
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
  * For multiple pages on a spread: name per page or empty string
  * Array always has `pages`amount of entries.
  * User can enter spread-name array members devided by pipe symbol:
  * `name="left|right"` will be exposed as `names=["left", "right"]`
  */
  names: Array<string>
  /**
  * Spread width in pixel
  */
  width: number;
  /**
  * Spread height in pixel
  */
  height: number;
  /*
  * Number of pages in this spread. Will be 1 or 2.
  */
  pages: number;
  /**
   * Array of page thumbnails. Url might be empty if not available 
   */
  thumbnails: Array<{ url: string, bgColor: string, pageId: string }>
}


export interface iExternalDocAndSpreadInfo {
  /**
   * The ID of the document
   */
  docId: string,
  /**
   * The Title of the document
   */
  docTitle: string,
  /**
   * Information about all spreads of this document
   */
  spreads: Array<iExternalSpreadInfo>,
  /**
   * The amount of spreads (not pages!) in this document
   */
  spreadCount: number,
  /**
   * Information if the document has facing pages. If `true` first and last spread has 1 page all other spreads have 2 pages.
   */
  facingPages: boolean,
  /**
   * Information if the document is set to "book" mode and can therefore add/remove pages etc.
   */
  isBook: boolean
}

export interface iExternalTab {
  id: string,
  caption: string,
  head?: string,
  icon: iconName
}
export interface iExternalSnippetCluster {
  tabId: string,
  name: string,
  columns: number,
  stickerMenuId: string,
  stickerMenuTags: string[] | ReadonlyArray<string>,
  snippets: Array<iExternalSnippet>;
}
export interface iExternalSnippet {
  title: string;
  snippetUrl: string;
  thumbUrl: string;
  bgColor: string;
  priceLabel: string;
  imageCount: number;
  sortNumber: number;
}


export interface iSnippetMenu {
  categories: Array<iSnippetMenuCategory>
  name: string
}

export interface iSnippetMenuCategory {
  topics: Array<iSnippetMenuTopic>
  name: string
}

export interface iSnippetMenuTopic {
  keywords: Array<string>;
  name: string;
  id: string;
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

export type iExternalPropertyKind = "color" | "single-line-text" | "text-area" | "label" | "checkbox" | "background-button" | "splitter-layouts-button" | "grid-gap-button" | "convert-to-image" | "convert-to-text" | "record-left-button" | "record-right-button" | "horizontal-scissor" | "vertical-scissor" | "multi-line-text" | "selection-text-style" | "number" | "pixelLength" | "image" | "font" | "select-list" | "select-list+info" | "image-list" | "color-list" | "table" | "image-id" | "patternTileWidth";

export type iExternalMetaPropertyKind = null |
  "text-style-color" | "text-style-size" | "text-style-line-height" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" | "text-style-vAlign-hAlign" | "text-style-paragraph-style" | "handwriting-image" |
  "image-scale" | "image-placement" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-invert" | "image-hueRotate" | "image-rotation" | "image-crop" | "image-filter"
  | "letter-generator";

export type FFInfoStyle = string;
export type FFInfoDisplayStyle = "text" | "bullets" | "numbers" | "html" | "panel" | "card";

export interface iExternalProperty {
  id: string;
  value: string | number;
  kind: iExternalPropertyKind;
  label: string;
  info: string;
  infoStyle: FFInfoStyle;
  controlGroup: number;
  validation?: iExternalValidation;
  textStyle?: iExternalTextStyle;
  imageMeta?: iExternalimageMeta;
  listMeta?: iExternalListMeta;
  tableMeta?: iExternalTableMeta;
  tabId?: string;
  validationResult?: {
    remainingChars: string,
    error: string
  }
}
export interface iExternalTextStyle {
  size: string;
  lineHeight: number;
  color: string;
  font: string;
  hAlign: "bullet" | "left" | "center" | "right" | "justifyLeft" | "justifyCenter" | "justifyRight" | "justifyJustify";
  vAlign: "top" | "center" | "bottom";
  allows: Array<"content" | "mandatory" | "color" | "stroke" | "font" | "size" | "lineHeight" | "tracking" | "baselineShift" | "horizontalAlignment" | "verticalAlignment" | "padding" | "styles" | "bullet" | "indent" | "paragraphSpacing" | "baselineGrid" | "handWriting" | "letterGenerator">;
  pStyle: string;
}
export interface iExternalValidation {
  maxChars: number;
  regExp: string;
  regExpMessage: string;
  defaultValue: string;
  isMandatory: boolean;
  clearOnFocus: boolean;
  noOffensiveLanguage: boolean;
  visibility: "always" | "conditional-on" | "conditional-off";
}
export interface iExternalListMeta {
  list: Array<iExternalFieldListEntry>;
  thumbWidth: number;
  thumbHeight: number;
  imageCss: string;
  descriptionFilter?: string;
}
export type iExternalFieldListEntry = {
  key: string,
  label: string, // multi-language??
  description: string,
  imageUrl: string,
  tag: string,
  enabled: boolean
}
export interface iExternalTableMeta {
  columns: Array<iExternalTableColumn>;
  month?: number;
  year?: number;
  tableType: "generic" | "calendar-events";
  maxTableEntries: number;
  tableAddOptions: Array<iExternalTableAddOption>
}

export type iExternalTableAddOption = {
  label: string,
  type: string,
  libFF: string,
  multi: boolean,
  bg: string
}

export interface iExternalTableColumn {
  name: string,
  label?: string,
  readonly?: boolean,
  data?: "string" | "boolean" | "number" | "image" | "color" | "multi",
  list?: Array<string | number>,
  listMode?: "select" | "auto-complete" | "multi-from-form-field",
  width?: string,
  row?: string,
  hide?: boolean,
  /** Maximum allowed characters */
  max?: number,
  inline?: boolean
  /* ADD NEW TABLE-FF COLUMN - add here and search for this comment - do not remove comment */
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
  invert: number;
  placement: "fit" | "fill" | "face" | "group",
  thumbUrl: string;
  thumbCssUrl: string;
  canUpload: boolean;
  hasFFCropEditor: boolean;
  /**
  * Indicates if you can modify scaling on that image 
  */
  canScale: boolean;
  canSetPlacement: boolean;
  canSetDefaultImage: boolean;
  allows: Array<"sepia" | "brightness" | "contrast" | "vivid" | "hueRotate" | "invert">;
  filterTags: ReadonlyArray<string> | Array<string>;
  isHandwriting: boolean;
  average: number;
}
export interface iExternalImageScaleHints {
  min: number;
  max: number;
  dpiAtScale1: number;
}

export type iExternalErrors = Array<iExternalError>

export interface iExternalError {
  boxIds: Array<string>,
  pinnedDocId?: string,
  errorCode: "preflight" | "rowIndexLessThanZero" | "invalidDayValue" | "imageResolutionLow" | "imageMissing" | "imageStillUploading" | "imageCouldNotUpload" | "textMissing" | "notChecked" | "characterMissing" | "maxCharsExceeded" | "offensiveLanguageDetected" | "regExpNotMatching" | "textOverflow" | "noLayoutSnippetSelected" | "invalidNumber" | "missingEventText" | "emptyBookPage",
  errorValue1: string | number,
  errorValue2?: string | number,
  errorValue3?: string | number
}

export interface iExternalFrame {
  top: string,
  left: string
}


export interface iExternalColor {
  mode: "rgb" | "cmyk";
  label: string;
  allowCMYK: boolean;

  r: number;  // 0-255
  g: number;
  b: number;

  c: number;  // 0-100
  m: number;
  y: number;
  k: number;
}

export type MergeMode = "merge" | "layout-snippet-no-repeat" | "layout-snippet-repeat-all" | "layout-snippet-repeat-inside"
  | "layout-snippet-no-repeat-persist-stickers" | "layout-snippet-repeat-all-persist-stickers" | "layout-snippet-repeat-inside-persist-stickers";
export type MergeResource = "snippets" | "fonts" | "colors" | "images";

export interface iMergeTemplate {
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
  /**
   * Force Printess to merge in a particular layout-snippet mode. 
   * Frames which are merged as "layout-snippets" or "repeat-snippets" will be removed once the user places a new layout-snippet of the same type.
   */
  mergeMode?: MergeMode;

  /**
   * Define which resources you want to merge from the template additionally. 
   */
  mergeResources?: MergeResource[];

  /**
   * Use the template name of this merge template to overwrite the master template name.
   * When producing this template, you'll see this merge template name instead of the master template name.
   */
  useAsTemplateName?: boolean;

  /* Pass a pixel based position for placing the snippet */
  pos?: iExternalRect;

  /** Tells printess to not apply exchange-id data */
  ignoreExchangeIds?: boolean
}

export declare type externalFormFieldChangeCallback = (name: string, value: string, tag: string, label: string, ffLabel: string) => void;
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>, scope: "document" | "frames" | "text") => void;
export declare type externalSpreadChangeCallback = (groupSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, layoutSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, tabs: ReadonlyArray<iExternalTab> | Array<iExternalTab>) => void;
export declare type externalGetOverlayCallback = (properties: Array<{ kind: iExternalPropertyKind, isDefault: boolean, isMandatory: boolean }>, width: number, height: number) => HTMLDivElement;
export declare type refreshPaginationCallback = null | (() => void);
export declare type receiveMessageCallback = null | ((topic: MessageTopic, data: Record<string, any>) => void);
export declare type refreshUndoRedoCallback = null | (() => void);
export declare type updatePageThumbnailCallback = null | ((spreadId: string, pageId: string, url: string) => void);
export declare type textStyleModeEnum = "default" | "all-paragraphs" | "all-paragraphs-if-no-selection";

export type MessageTopic = "SplitterFrameToText" | "ShowAlert" | "OpenImageUpload" | "MobileImagesUpload";

export interface iExternalImage {
  id: string;
  originalImageUrl: string;
  thumbUrl: string;
  thumbCssUrl: string;
  width: number;
  height: number;
  fileHash: string;
  inUse: boolean;
  useCount: number;
  group: string;
  average: number;
}

export interface iExternalButton {
  type: "callback" | "print" | "back" | "next" | "addToBasket" | "undo" | "redo",
  callback?: () => void,
  caption?: string
}

export interface iDropdownItems {
  caption: string,
  disabled?: boolean,
  show: boolean,
  task: () => void
}

export interface iExternalRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface iMobileUIButton {
  icon?: iconName | "none",
  thumbCssUrl?: string,
  circleStyle?: string,
  ffCircleCaption?: string,
  caption: string,
  hasCollapsedMetaProperties: boolean,
  newState: iMobileUiState,
  hide?: boolean
}

export interface iMobileUiState {
  state: "ext-value" | "form-fields" | "selection" | "imageCrop" | "table-edit" | "off-canvas"
  externalProperty?: iExternalProperty,
  metaProperty?: iExternalMetaPropertyKind,
  tableRowIndex?: number
}


export type MobileUiState = "document" | "frames" | "details" | "text";

export interface MobileUiMenuItems {
  id: "back" | "save" | "load" | "expert" | "undo" | "redo" | "addPages" | "arrangePages" | "previous" | "next" | "firstStep" | "lastStep",
  title: string,
  icon?: iconName,
  disabled: boolean,
  show: boolean,
  task: () => void
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

export interface FormFieldEntry {
  key: string;
  label: string;
  description: string;
}

export interface FormFieldItem {
  name: string;
  value: string;
  visibility: string;
  isPriceRelevant: boolean;
  entries: FormFieldEntry[];
}

export interface ContentEditableItem {
  id: string;
  name: string;
  isMandatory: boolean;
  value: string;
  maxCharacters: number;
}

export interface DocumentContentEditables {
  id: string;
  name: string;
  simpleTexts: ContentEditableItem[];
  multilineTexts: ContentEditableItem[];
  images: ContentEditableItem[];
  stories: Record<string, string[]>;
}

export interface TemplateEditables {
  primaryDocument: DocumentContentEditables;
  formFields: FormFieldItem[];
}


/**
 * @deprecated 
 * This interface is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
 */
export interface iFrameCountAndClasses {
  documentName: string,
  frames: number,
  spreads: Array<iFrameCountAndClassesSpread>
}

/**
 * @deprecated 
 * This interface is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
 */
export interface iFrameCountAndClassesSpread {
  spreadName: string,
  frames: number,
  classes: Record<string, number>
}

/** Provides information about number of frames edited by the buyer per document */
export interface iFrameCountAndMarkers {
  /** Name of document */
  documentName: string,
  /** Count of buyer manipulated frames */
  frames: number,
  /** Detailed information about all spreads */
  spreads: Array<iFrameCountAndMarkersSpread>
}

/** Provides information about number of frames edited by the buyer per spread */
export interface iFrameCountAndMarkersSpread {
  /** Name of spread  */
  spreadName: string,
  /** Count of buyer manipulated frames on spread */
  frames: number,
  /** List of markes used by buyer manipulted frames on spread*/
  markers: Record<string, number>
}

/** 
 * passed whenever a price could have possible changed
 * contains all price-relevant informations from printess in one place
 */
export type iExternalProductPriceInfo = {
  /** key / value list of all price relevant form fields */
  priceRelevantFormFields: { [key: string]: { value: string, tag: string } },

  /** Sum of all used priceCategoryGroups and there used amounts
   * All used layout-snippets and stickers with a price category
   * will be summed up here 
   * Form Fields with per-letter price catogorie will show here as well */
  snippetPriceCategories: Array<iUsedPriceCategory>,

  /**
   * @deprecated 
   * A list of all used document-price-categories. Only returns documents which have actually been edited by the buyer  
   * Important: Its depricated, You can not enable this feature anymore!
   */
  priceCategories: Array<string>
}

/** Information about all used price categories plus the number of usages. 
 * 'priceCategory' starts with 1(!)
*/
export interface iUsedPriceCategory {
  priceCategory: number,
  amount: number
}

/** Callback executed whenever price relevant information has changed.
 * Once calculated the new price you can call `refreshPriceDisplay()`to update 
 * the price and product informations for the user.
 * Example for iframe integration: (can be called on `uiHelper` as well) 
 * ``` 
    iframe.contentWindow.postMessage({
      cmd: "refreshPriceDisplay", display: {
        price: string, // any string like "32.34€"
        oldPrice?: string // will be crossed out
        legalNotice?: string, // will be displayed under the price
        productName?: string // to change product name dynamically 
      })}
    }, "*");
    ```
  */
export type externalPriceChangeCallback = (infos: iExternalProductPriceInfo) => void;

/**
 * Structure expected when calling set price information 
 */
export interface iExternalPriceDisplay {
  price: string,
  oldPrice?: string
  legalNotice?: string,
  /**
   *  can be dependend on form fields
   */
  productName?: string
  /**
   *  will be displayed via info icon in an iframe.
   */
  infoUrl?: string
}


export type iconName =
  "image"
  | "image-solid"
  | "image-regular"
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
  | "minus-light"
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
  | "check-circle-solid"
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
  | "arrows"
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
  | "save-light"
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
  | "place-image"
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
  | "mirror-y"
  | "angle-up-light"
  | "angle-down-light"
  | "chevron-up-light"
  | "chevron-down-light"
  | "sign-in-light"
  | "share-light"
  | "share-solid"
  | "reply-light"
  | "reply-solid"
  | "undo-arrow"
  | "redo-arrow"
  | "rotate"
  | "primary"
  | "back"
  | "angle-double-right"
  | "angle-double-left"
  | "arrow-to-right"
  | "arrow-to-left"
  | "distribute-image"
  | "minus-square"
  | "arrow-square-right"
  | "bullseye-pointer-solid"
  | "hand-pointer-light"
  | "eye-dropper"
  | "eye-dropper-light"
  | "cloud-upload-light"
  | "cloud-upload-check"
  | "shopping-basket"
  | "shopping-basket-light"
  | "home-solid"
  | "home-light"
  | "smile"
  | "code-curly"
  | "text-bottom"
  | "text-center"
  | "text-top"
  | "pen-swirl"
  | "pen-solid"
  | "circle-1"
  | "shirt"
  | "focus-face"
  | "focus-group"
  | "handwriting"
  | "burger-menu"
  | "grid-lines"
  | "info-circle"
  | "camera-slash"
  | "record-up"
  | "record-down"
  | "arrow-left-circle"
  | "arrow-right-circle"
  | "arrow-right-long"
  | "camera-solid"
  | "desktop-mobile-duotone"
  | "cloud-check-duotone"

  | "add-gap-around"
  | "remove-gap-around"
  ;
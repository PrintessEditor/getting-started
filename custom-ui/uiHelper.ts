/* eslint-disable @typescript-eslint/ban-ts-comment */

import { iconName, iExternalError, iExternalListMeta, iExternalPriceDisplay, iExternalFieldListEntry, iExternalProperty, iExternalSnippetCluster, iExternalSpreadInfo, iPrintessApi, iMobileUIButton, iExternalMetaPropertyKind, MobileUiState, iMobileUiState, iExternalTableColumn, iExternalPropertyKind, iExternalImage, MobileUiMenuItems, iExternalSnippet, iExternalTab, iDropdownItems, iExternalDocAndSpreadInfo } from "./printess-editor";

declare const bootstrap: any;

(function () {
  (<any>window).uiHelper = {
    getOverlay: getOverlay,
    renderMobileUi: renderMobileUi,
    renderMobileNavBar: renderMobileNavBar,
    renderDesktopUi: renderDesktopUi,
    refreshUndoRedoState: refreshUndoRedoState,
    refreshPagination: refreshPagination,
    refreshPriceDisplay: refreshPriceDisplay,
    updatePageThumbnail: updatePageThumbnail,
    viewPortScroll: viewPortScroll,
    viewPortResize: viewPortResize,
    viewPortScrollInIFrame: viewPortScrollInIFrame,
    resize: resize,
    resetUi: resetUi,
    customLayoutSnippetRenderCallback: undefined
  }

  const canUseStorage = (function () {
    try {
      sessionStorage.setItem("test", "value");
      return true;
    } catch (error) {
      return false;
    }
  })();

  const fallbackStorage: Record<string, string> = {};

  function setStorageItemSafe(key: string, value: string) {
    if (canUseStorage) {
      sessionStorage.setItem(key, value);
    } else {
      fallbackStorage[key] = value;
    }
  }

  function getStorageItemSafe(key: string): string | null {
    if (canUseStorage) {
      return sessionStorage.getItem(key);
    } else {
      return fallbackStorage[key] ?? null;
    }
  }

  function resetUi(): void {
    // called before toggle to buyer side in design mode
    uih_currentTabId = "LOADING";
    uih_currentPriceDisplay = undefined;
    uih_mobilePriceDisplay = "none";
  }

  let uih_viewportHeight: number = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  let uih_viewportWidth: number = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  let uih_viewportOffsetTop: number = 0;

  let uih_currentGroupSnippets: Array<iExternalSnippetCluster> = [];
  let uih_currentProperties: Array<iExternalProperty> = [];
  let uih_currentTabs: Array<iExternalTab> = [];
  let uih_currentTabId: string = "LOADING";
  let uih_currentLayoutSnippets: Array<iExternalSnippetCluster> = [];
  let uih_previousLayoutSnippets: Array<iExternalSnippetCluster> = [];
  let uih_currentState: MobileUiState = "document";
  let uih_currentRender: "mobile" | "desktop" | "never" = "never";
  let uih_currentVisiblePage: "left-page" | "right-page" | "entire" | null;
  let uih_currentPriceDisplay: iExternalPriceDisplay | undefined;
  let uih_mobilePriceDisplay: "none" | "open" | "closed" = "none";

  let uih_lastMobileState: iMobileUiState | null = null;
  let uih_autoSelectPending: boolean = false;

  let uih_lastPrintessHeight = 0;
  let uih_lastPrintessWidth = 0;
  let uih_lastPrintessTop: number | null = null;
  let uih_lastMobileUiHeight = 0;
  let uih_lastZoomMode: "spread" | "frame" | "unset" = "unset";
  let uih_lastFormFieldId: undefined | string = undefined;

  let uih_stepTabOffset = 0;
  let uih_stepTabsScrollPosition = 0;
  let uih_snippetsScrollPosition = 0;

  let uih_lastOverflowState = false;
  let uih_activeImageAccordion = "Buyer Upload";

  let uih_ignoredLowResolutionErrors: Array<string> = [];

  let uih_layoutSelectionDialogHasBeenRendered = false;

  let uih_lastDragTarget: string | undefined;

  //console.log("Printess ui-helper loaded");

  async function validateAllInputs(printess: iPrintessApi, buttonType: "preview" | "validateAll"): Promise<boolean> {
    const errors = await printess.validateAsync("all");
    const filteredErrors = errors.filter(e => e.errorCode !== "imageResolutionLow");
    filteredErrors.push(...errors.filter(e => e.errorCode === "imageResolutionLow" && !uih_ignoredLowResolutionErrors.includes(e.boxIds[0])));
    if (filteredErrors.length > 0) {
      printess.bringErrorIntoView(filteredErrors[0]);
      getValidationOverlay(printess, filteredErrors, buttonType);
      return false;
    }
    return true;
  }

  function handleBackButtonCallback(printess: iPrintessApi, callback: CallableFunction) {
    if (printess.isInDesignerMode()) {
      // do not save in designer mode.
      callback("");
    } else {
      printess.save().then((token) => {
        callback(token);
      }).catch(reason => { // bkr: ALWAYS callback... otherwise you are stuck in the designer... asd
        console.error(reason);
        callback("");
      });
    }

    const closeLayoutsButton = <HTMLButtonElement>document.getElementById("closeLayoutOffCanvas");
    if (closeLayoutsButton) {
      closeLayoutsButton.click();
    }

    // add some timeout to ensure toggling back to admin side has been completed
    window.setTimeout(() => {
      removeAllUiHints();
      uih_ignoredLowResolutionErrors = [];
      uih_layoutSelectionDialogHasBeenRendered = false;
    }, 200);
  }

  function removeAllUiHints() {

    if (renderEditableFramesHintTimer) {
      window.clearTimeout(renderEditableFramesHintTimer);
    }
    const layoutHint = document.getElementById("ui-hint-changeLayout");
    if (layoutHint) layoutHint.remove();

    const expertHint = document.getElementById("ui-hint-expertMode");
    if (expertHint) expertHint.remove();

    const editableFrameHint = <HTMLDivElement>document.querySelector("div#frame-pulse.frame-hint-pulse");
    if (editableFrameHint) {
      editableFrameHint.remove();
    }
  }

  async function addToBasket(printess: iPrintessApi) {
    const validation = await validateAllInputs(printess, "validateAll");
    if (!validation) {
      return;
    }

    const callback = printess.getAddToBasketCallback();
    if (callback) {
      await printess.clearSelection();
      printess.showOverlay(printess.gl("ui.saveProgress"))
      const saveToken = await printess.save();
      let url = "";
      if (printess.noBasketThumbnail() !== true) {
        url = await printess.renderFirstPageImage("thumbnail.png");
      }
      callback(saveToken, url);
      printess.hideOverlay();
    } else {
      alert(printess.gl("ui.addToBasketCallback"));
    }
  }

  async function saveTemplate(printess: iPrintessApi, type: "save" | "close") {
    const callback = printess.getSaveTemplateCallback();
    const saveButton = document.getElementById("printess-save-button");

    if (callback) {
      await printess.clearSelection();
      if (saveButton) saveButton.classList.add("disabled");
      printess.showOverlay(printess.gl("ui.saveProgress"));
      const saveToken = await printess.save();
      callback(saveToken, type);
      printess.hideOverlay();
    } else {
      alert(printess.gl("ui.saveTemplateCallback"))
    }
  }

  async function gotoNextStep(printess: iPrintessApi): Promise<void> {
    const buttonType = printess.isNextStepPreview() ? "preview" : "next";
    const errors = await printess.validateAsync(printess.hasNextStep() ? "until-current-step" : "all");
    const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
    if (filteredErrors.length > 0) {
      printess.bringErrorIntoView(filteredErrors[0]);
      getValidationOverlay(printess, filteredErrors, buttonType);
      return;
    }
    if (printess.hasNextStep()) {
      printess.nextStep();
    } else {
      addToBasket(printess);
    }
  }
  async function gotoStep(printess: iPrintessApi, stepIndex: number): Promise<void> {
    const errors = await printess.validateAsync("until-current-step");
    const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
    if (filteredErrors.length > 0) {
      printess.bringErrorIntoView(filteredErrors[0]);
      getValidationOverlay(printess, filteredErrors, "next", stepIndex);
      return;
    }
    return printess.setStep(stepIndex);
  }


  function viewPortScroll(printess: iPrintessApi) {
    // safari pushes viewport up to show keyboars, android doesn't
    if (printess) {
      _viewPortScroll(printess, "scroll");
    }
  }
  function viewPortResize(printess: iPrintessApi) {
    if (printess) {
      checkAndSwitchViews(printess);
      _viewPortScroll(printess, "resize");
    }
  }

  function resize(printess: iPrintessApi) {
    if (printess) {
      checkAndSwitchViews(printess);
      printess.resizePrintess(false, false, undefined);
    }
  }

  function checkAndSwitchViews(printess: iPrintessApi) {
    if (printess) {
      const mobile = printess.isMobile();
      if (mobile && uih_currentRender !== "mobile") {
        // switch to mobile
        renderMobileUi(printess);
        renderMobileNavBar(printess);
        removeExternalSnippetsContainer();
      }
      if (!mobile && uih_currentRender !== "desktop") {
        // switch to desktop
        renderDesktopUi(printess);
        removeExternalSnippetsContainer();
      }
    }
  }
  function refreshPriceDisplay(printess: iPrintessApi, priceDisplay: iExternalPriceDisplay) {

    uih_currentPriceDisplay = priceDisplay;

    if (priceDisplay && uih_currentRender === "mobile") {
      document.body.classList.add("has-mobile-price-bar");
      resizeMobileUi(printess);
    } else {
      document.body.classList.remove("has-mobile-price-bar");
    }

    const priceDiv = <HTMLDivElement>document.getElementById("total-price-display");
    if (priceDiv) {
      getPriceDisplay(printess, priceDiv, priceDisplay, uih_currentRender === "mobile");
    }

    // console.error("NEW PRICING ARRIVED", priceDisplay);
  }

  function getIframeOverlay(printess: iPrintessApi, title: string, infoUrl: string, forMobile: boolean): void {
    const iframe = document.createElement("iframe");
    iframe.title = printess.gl(title);
    iframe.src = infoUrl.startsWith("/") ? window.origin + infoUrl : infoUrl;
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    if (forMobile) {
      const productInfoDiv = document.getElementById("PRICE-INFO");
      if (productInfoDiv) {
        productInfoDiv.remove();
      }
      renderMobileDialogFullscreen(printess, "PRICE-INFO", title, iframe, false);
    } else {
      showModal(printess, "PRICE-MODAL", iframe, title);
    }
  }

  function getPriceDisplay(printess: iPrintessApi, priceDiv: HTMLDivElement, priceDisplay: iExternalPriceDisplay | undefined, forMobile: boolean = false): void {
    const price = priceDisplay?.price || "";
    const oldPrice = priceDisplay?.oldPrice || "";
    const legalNotice = priceDisplay?.legalNotice || "";
    const productName = priceDisplay?.productName || printess.getTemplateTitle();
    const infoUrl = printess.getProductInfoUrl() || priceDisplay?.infoUrl || "";

    priceDiv.innerHTML = "";

    const headline = document.createElement("div");
    headline.className = "total-price-headline";

    if (productName) {
      const dekstopTitle = <HTMLElement>document.querySelector(".desktop-title-bar > h3") || <HTMLElement>document.querySelector(".desktop-title-bar > h2");
      if (dekstopTitle) dekstopTitle.style.display = "none";
      const productNameSpan = document.createElement("span");
      productNameSpan.className = "product-name";
      productNameSpan.innerText = printess.gl(productName);

      const currentStep = printess.getStep();
      const showStepTitle = printess.stepHeaderDisplay() === "only title" || printess.stepHeaderDisplay() === "title and badge";
      if (currentStep && showStepTitle) {
        productNameSpan.innerText = printess.gl(currentStep.title) || printess.gl("ui.step") + (currentStep.index + 1);
      }

      headline.appendChild(productNameSpan);
    }
    if (!legalNotice) {
      priceDiv.classList.add("price-info-only");
    } else {
      priceDiv.classList.remove("price-info-only");
    }

    const oldPriceSpan = document.createElement("span");
    oldPriceSpan.style.textDecoration = "line-through";
    oldPriceSpan.className = "me-2";
    oldPriceSpan.innerText = printess.gl(oldPrice);

    const newPriceSpan = document.createElement("span");
    if (oldPrice) newPriceSpan.style.color = "red";
    newPriceSpan.innerText = printess.gl(price);

    if (infoUrl) {
      const infoIcon = printess.getIcon("info-circle");
      infoIcon.classList.add("price-info-icon");
      if (oldPrice) infoIcon.style.marginRight = "6px";
      infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), infoUrl, forMobile);
      headline.appendChild(infoIcon);
    }

    headline.appendChild(oldPriceSpan);
    headline.appendChild(newPriceSpan);
    priceDiv.appendChild(headline);

    const subline = document.createElement("span");
    subline.className = "total-price-subline";
    subline.innerHTML = getLegalNoticeText(printess, legalNotice, forMobile);
    priceDiv.appendChild(subline);
  }

  function getLegalNoticeText(printess: iPrintessApi, legalNotice: string, forMobile: boolean): string {
    const regex = /\[([^)]*)\]\(([^\]]*)\)/gm   // /\[([^)]*)\]\((http[^\]]*)\)/gm

    const listOfLinks = legalNotice.match(regex) || "";

    if (listOfLinks) {
      for (let i = 0; i < listOfLinks.length; i++) {
        const text = listOfLinks[i].split("](")[0].replace("[", "");
        const link = listOfLinks[i].split("](")[1].replace(")", "");
        const id = "legal-notice-link-" + i;
        const a = `<span id=${id} style="color: var(--bs-primary); cursor: pointer;">${text}</span>`;

        legalNotice = legalNotice.replace(listOfLinks[i], a);

        window.setTimeout(() => {
          const agb = document.getElementById(id);
          if (agb) agb.onclick = () => getIframeOverlay(printess, text, link, forMobile);
        }, 100)
      }
    }

    return legalNotice;
  }

  function refreshPagination(printess: iPrintessApi) {

    if (uih_currentRender === "mobile") {
      renderPageNavigation(printess, getMobilePageBarDiv(), false, true);
      renderMobileNavBar(printess);
    } else {
      renderPageNavigation(printess);
    }
  }

  function _viewPortScroll(printess: iPrintessApi, _what: "scroll" | "resize") {
    //console.log("!!!! View-Port-" + what + "-Event: top=" + window.visualViewport.offsetTop, window.visualViewport);
    // das funktioniert so auch nicht, wenn vom iFrame host durchgereicht. Ist immer anders als die lokal empfangene viewPort Height
    if (uih_viewportOffsetTop !== window.visualViewport?.offsetTop || uih_viewportHeight !== window.visualViewport?.height || uih_viewportWidth !== window.visualViewport?.width) {

      //console.log("!!!! View-Port-" + _what + "-Event: top=" + window.visualViewport.offsetTop + "   Height=" + window.visualViewport.height, window.visualViewport);

      uih_viewportOffsetTop = window.visualViewport?.offsetTop ?? 0;
      uih_viewportHeight = window.visualViewport?.height ?? 0;
      uih_viewportWidth = window.visualViewport?.width ?? 0;
      const printessDiv = document.getElementById("desktop-printess-container");
      if (printessDiv) {
        if (printess.isMobile()) {
          printessDiv.style.height = "";
          /*if (window.visualViewport.offsetTop > 0 || keyboardExpanded) {
            // system has auto scrolled content, so we adjust printess-editor to fit and auto focus selected element 
            printess.setZoomMode("frame");
            resizeMobileUi(printess);
          } else {
            printess.setZoomMode("spread");
            resizeMobileUi(printess);
          }*/
          resizeMobileUi(printess);
        } else {
          // safari can't determine grid row-height automatically (1fr);
          const desktopGrid: HTMLElement | null = document.getElementById("printess-desktop-grid");
          if (desktopGrid) {
            if (printess.autoScaleDetails().enabled) {
              printessDiv.style.height = Math.floor(printess.autoScaleDetails().height - 1) + "px";
              printessDiv.style.width = Math.floor(printess.autoScaleDetails().width - 1) + "px";
              printess.resizePrintess();
            } else {
              const height = desktopGrid.offsetHeight || window.innerHeight; // fallback when running inside printess-editor
              const calcHeight = "calc(" + Math.floor(height) + "px - var(--editor-pagebar-height) - var(--editor-margin-top) - var(--editor-margin-bottom))";
              printessDiv.style.height = calcHeight;

              const desktopProperties = document.getElementById("desktop-properties");
              const tabsContainer = <HTMLDivElement>document.querySelector(".tabs-navigation");
              if (printess.showTabNavigation() && desktopProperties) {
                desktopProperties.style.height = calcHeight;
                if (tabsContainer) {
                  renderTabsNavigation(printess, tabsContainer, false);
                }
              }
              printess.resizePrintess(); //false, undefined, undefined, height);
            }
          }
        }
      }
    }
  }

  function getActiveFormFieldId(): string | undefined {
    const ele = document.querySelector('.mobile-control-host input[type="text"]');
    if (ele && ele.id && ele.id.startsWith("inp_FF_")) {
      return ele.id.substr(7);
    }
    return undefined;
  }

  function viewPortScrollInIFrame(printess: iPrintessApi, vpHeight: number, vpOffsetTop: number) {
    //console.log("!!!! View-Port-Scroll in iFrame: offsetTop=" + vpOffsetTop + "   height=" + vpHeight);
    uih_viewportHeight = vpHeight;
    uih_viewportOffsetTop = vpOffsetTop;
    uih_viewportWidth = window.innerWidth;
    printess.setIFrameViewPort({ offsetTop: vpOffsetTop, height: vpHeight });
    const printessDiv = document.getElementById("desktop-printess-container");
    if (printessDiv) {
      resizeMobileUi(printess);
      /*if (vpOffsetTop > 0) {
        // system has auto scrolled content, so we adjust printess-editor to fit and auto focus selected element 
        printess.setZoomMode("frame");
        resizeMobileUi(printess);
      } else {
        printess.setZoomMode("spread");
        resizeMobileUi(printess);
      }*/
    }
  }


  function renderDesktopUi(printess: iPrintessApi, properties: Array<iExternalProperty> = uih_currentProperties, state: MobileUiState = uih_currentState, groupSnippets: Array<iExternalSnippetCluster> = uih_currentGroupSnippets, layoutSnippets: Array<iExternalSnippetCluster> = uih_currentLayoutSnippets, tabs: Array<iExternalTab> = uih_currentTabs): Array<string> {

    if (uih_currentRender === "never") {
      // initialize grid-position
      if (window.visualViewport && !printess.autoScaleEnabled()) {
        uih_viewportHeight = -1; // force re-rendering the view
        _viewPortScroll(printess, "resize");
      } else {
        printess.resizePrintess();
      }
    } else if (uih_currentRender === "mobile" && printess.autoScaleDetails().enabled) {
      printess.resizePrintess();
    }


    uih_currentTabs = tabs;
    uih_currentGroupSnippets = groupSnippets;
    uih_currentLayoutSnippets = layoutSnippets;
    uih_currentState = state;
    uih_currentProperties = properties;
    uih_currentRender = "desktop";

    // remove mobile ui if rendered before
    const mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
    if (mobileUi) {
      mobileUi.innerHTML = "";
    }
    removeMobileFullscreenContainer();
    const mobilePricebar: HTMLDivElement | null = document.querySelector(".mobile-pricebar");
    if (mobilePricebar) {
      mobilePricebar.remove();
    }
    const mobilePricebarOpener: HTMLDivElement | null = document.querySelector(".mobile-price-display-opener");
    if (mobilePricebarOpener) {
      mobilePricebarOpener.remove();
    }

    const printessDiv = document.getElementById("desktop-printess-container");
    const container = document.getElementById("desktop-properties");
    if (!container || !printessDiv) {
      throw new Error("#desktop-properties or #desktop-printess-container not found, please add to html.")
    }

    const isPageIconsNavigation = printess.pageNavigationDisplay() === "icons";
    const isDocTabs = printess.pageNavigationDisplay() === "doc-tabs";
    const isStepTabsList = printess.stepHeaderDisplay() === "tabs list";
    const isStepBadgeList = printess.stepHeaderDisplay() === "badge list";

    if (isStepTabsList || isDocTabs || isPageIconsNavigation) {
      container.classList.add("move-down");
    } else {
      container.classList.remove("move-down");
    }

    printessDiv.style.position = "relative"; // reset static from mobile, be part of parent layout again
    printessDiv.style.top = "";
    printessDiv.style.left = "";
    printessDiv.style.bottom = "";
    printessDiv.style.right = "";

    container.innerHTML = "";
    container.style.height = "-webkit-fill-available";
    let t: Array<string> = [];

    const nav = getMobileNavbarDiv();
    if (nav) nav.parentElement?.removeChild(nav);

    renderPageNavigation(printess);

    // for Desktop Tab Navigation keep title / current step and basket button separate from properties container
    let desktopTitleOrSteps: HTMLDivElement | null = document.querySelector("div.desktop-title-or-steps")
    if (!desktopTitleOrSteps) {
      desktopTitleOrSteps = document.createElement("div");
      desktopTitleOrSteps.className = "desktop-title-or-steps";
    } else {
      desktopTitleOrSteps.innerHTML = "";
    }

    // tab lists and icons bring their own navigation buttons .. steps are not displayed in title
    if (!isPageIconsNavigation && !isStepTabsList && !isStepBadgeList && !isDocTabs) {
      if (printess.hasSteps()) {
        // if document has steps, display current step:
        const desktopStepsUi = getDesktopStepsUi(printess);
        if (printess.showTabNavigation()) {
          desktopTitleOrSteps.appendChild(desktopStepsUi)
        } else {
          container.appendChild(desktopStepsUi);
        }

      } else {
        // display template name:
        const desktopTitle = getDesktopTitle(printess);
        if (printess.showTabNavigation()) {
          desktopTitleOrSteps.appendChild(desktopTitle);
        } else {
          container.appendChild(desktopTitle);
        }
      }
    }

    // Adjust Desktop View for Preview
    if (printess.hasPreviewBackButton() && !printess.showTabNavigation()) {
      printessDiv.classList.add("preview-fullwidth-grid");
      printess.resizePrintess();
    } else if (printessDiv.classList.contains("preview-fullwidth-grid")) {
      printessDiv.classList.remove("preview-fullwidth-grid");
      printess.resizePrintess();
    }

    // Adjust Desktop View for Tab Navigation
    adjustDesktopView(printess, desktopTitleOrSteps, container, printessDiv, state);

    // add editable frames hint to session storage if frame has been selected
    if (printess.hasSelection()) {
      setStorageItemSafe("editableFrames", "hint closed");
      const framePulse = document.getElementById("frame-pulse");
      if (framePulse) framePulse.parentElement?.removeChild(framePulse);
    }

    // translate change Layout button text
    const layoutSnippetAmount = layoutSnippets.map(ls => ls.snippets.length).reduce((prev, curr) => prev + curr, 0);
    const layoutsButton = <HTMLButtonElement>document.querySelector(".show-layouts-button");
    if (layoutsButton) {
      layoutsButton.textContent = printess.gl("ui.changeLayout");
      if (printess.showTabNavigation()) {
        layoutsButton.style.visibility = "hidden";
      } else if (layoutSnippetAmount > 0) {
        layoutsButton.style.visibility = "visible";
      }
    }

    // render desktop ui hints
    renderUiButtonHints(printess, document.body, state, false);
    renderEditableFramesHint(printess);

    // toggle Ui Settings button when switching to Preview and back
    const printessBuyerPropertiesButton = document.getElementById("printessBuyerPropertiesButton");
    if (printessBuyerPropertiesButton) {
      if (printess.hasPreviewBackButton()) {
        printessBuyerPropertiesButton.style.display = "none";
      } else {
        printessBuyerPropertiesButton.style.display = "block";
      }
    }

    // open dialog with layout snippets
    if (!uih_layoutSelectionDialogHasBeenRendered && layoutSnippetAmount > 0 && printess.showLayoutsDialog()) {
      uih_layoutSelectionDialogHasBeenRendered = true;
      renderLayoutSelectionDialog(printess, layoutSnippets, false);
    }

    // attach/remove shadow pulse animation to/from "change layout" button
    if (state === "document" && printess.hasLayoutSnippets() && !getStorageItemSafe("changeLayout") && !printess.showTabNavigation()) {
      toggleChangeLayoutButtonHint();
    }

    // hide external layout snippets container
    const externalLayoutsContainer = document.getElementById("external-layouts-container");
    if (externalLayoutsContainer && (uih_currentTabId !== "#LAYOUTS" || layoutSnippetAmount === 0)) {
      externalLayoutsContainer.style.display = "none";
    }

    // handle Offcanvas for Layout Snippets
    if (!printess.showTabNavigation() && layoutSnippetAmount > 0) {
      handleOffcanvasLayoutsContainer(printess, false);
    }

    // Adjust ff-tab-id 
    if (printess.showTabNavigation()) {
      const newTab = getFormFieldTab(properties);
      if (newTab && newTab !== uih_currentTabId) {
        selectTab(printess, newTab);
      }
    }


    if (printess.hasPreviewBackButton()) {
      // do not render properties in preview
    } else if (state === "document") {
      //****** Show Document Wide Options


      // render properties
      const propsDiv = document.createElement("div");
      const props = getProperties(printess, state, properties, propsDiv);
      t = t.concat(props);

      if (printess.hasBackground() && !printess.showTabNavigation()) {
        propsDiv.appendChild(getChangeBackgroundButton(printess));
      }

      if (printess.showTabNavigation()) {
        if (uih_currentTabId) {
          container.appendChild(getPropertiesTitle(printess));
          if (uih_currentTabId.startsWith("#FORMFIELDS")) {
            container.appendChild(propsDiv);
          } else if (uih_currentTabId === "#LAYOUTS" && layoutSnippetAmount === 0) {
            uih_currentTabId = printess.getInitialTabId();
            renderTabNavigationProperties(printess, container, false);
          } else {
            renderTabNavigationProperties(printess, container, false);
          }
        } else {
          container.appendChild(propsDiv);
        }

      } else {
        container.appendChild(propsDiv);
        container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
      }

      if (printess.showTabNavigation() && printess.stepHeaderDisplay() === "tabs list") {
        // do not add done buttons
      } else if (printess.hasSteps()) {
        container.appendChild(getDoneButton(printess));
      }

    } else {

      //****** Show Just the frame / text Properties

      /* if (properties.filter(p => p.kind.includes("image")).length && !printess.isBackgroundSelected()) {
        uih_currentTabId = "#IMAGES";
        container.appendChild(getPropertiesTitle());
        const printessDesktopGrid = document.getElementById("printess-desktop-grid");
        if (printessDesktopGrid) {
          const tabsContainer = getDesktopTabsContainer(printessDesktopGrid);
          renderTabsNavigation(printess, tabsContainer);
        }
      } */

      const renderPhotoTabForEmptyImage = false;
      if (printess.showTabNavigation() && uih_currentTabId === "#PHOTOS") {
        if (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "image") {
          const p = uih_currentProperties[0];
          if (p.value === p.validation?.defaultValue) {
            // only a single unassigned image -> show photos tab 

            //renderPhotoTabForEmptyImage = true;
          }
        }
      }

      if (renderPhotoTabForEmptyImage) {
        container.appendChild(getPropertiesTitle(printess));
        renderTabNavigationProperties(printess, container, false);
      } else {
        if (printess.showTabNavigation()) {
          container.appendChild(getPropertiesTitle(printess));
        }
        // || state === "text" && properties.length === 1 && properties[0].kind === "selection-text-style" && properties[0].textStyle?.allows.length === 1 && properties[0].textStyle?.allows[0] === "content"
        if (state === "text") {
          if (!printess.isTextEditorOpen() && printess.showEnterTextEditorButton()) {
            const textEditInfo = document.createElement("p");
            textEditInfo.textContent = printess.gl("ui.editTextButtonInfo");

            const textEditBtn = document.createElement("button");
            textEditBtn.className = "btn btn-primary mt-2 d-flex align-items-center";
            textEditBtn.style.width = "fit-content";

            const icon = printess.getIcon("pen-solid");
            icon.classList.add("me-2");
            icon.style.width = "16px";
            icon.style.height = "16px";

            const span = document.createElement("span");
            span.textContent = printess.gl("ui.editTextButton");

            textEditBtn.appendChild(icon);
            textEditBtn.appendChild(span);

            textEditBtn.onclick = () => {
              printess.showTextEditor();
            }

            container.appendChild(textEditInfo);
            container.appendChild(textEditBtn);
          }
        }
        const props = getProperties(printess, state, properties, container);
        t = t.concat(props);
      }

      if (properties.length === 0 && state !== "text") {
        // render Group Snippets in case there is no property associated with the current selection
        if (!printess.showTabNavigation()) {
          container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
        }
      } else if (renderPhotoTabForEmptyImage || (printess.showTabNavigation() && printess.stepHeaderDisplay() === "tabs list")) {
        // do not attach done button because #PHOTOS tab stays active
      } else {
        if (printess.hasSteps() || !printess.showTabNavigation()) {
          const hr = document.createElement("hr");
          container.appendChild(hr);
        }
        container.appendChild(getDoneButton(printess));
      }
    }
    return t;
  }

  function getFormFieldTab(properties: Array<iExternalProperty>): string | null {
    // only return tab if all properties are associalted with same tab
    if (!uih_currentTabId.startsWith("#FORMFIELDS") && !uih_currentTabId.startsWith("#NONE")) {
      return null;
      // photo tab wil be set via clear selection, so we have no idea what the users last click was ...
    }
    const ffProps = properties.filter(p => p.id.startsWith("FF_"));
    const ffTabs: Set<string> = new Set();
    if (ffProps.length === properties.length && ffProps.length > 0) {
      // only form fields, get propper tabId 
      for (const ffProp of ffProps) {
        if (ffProp.tabId) {
          ffTabs.add(ffProp.tabId);
        } else {
          ffTabs.add("#FORMFIELDS");
        }
      }
      if (ffTabs.size === 1) {
        // only set if all properties are in the same tab
        return ffTabs.values().next().value;
        /* const ffTabsArray = Array.from(ffTabs.values()).sort();
         if (ffTabsArray[0] !== uih_currentTabId) {
           return ffTabsArray[0];
         }*/
      }
    }
    return null;
  }

  function getProperties(printess: iPrintessApi, state: MobileUiState = uih_currentState, properties: Array<iExternalProperty>, propsDiv: HTMLElement): Array<string> {
    const t: string[] = [];
    let controlGroup: number = 0;
    let controlGroupDiv: HTMLDivElement | null = null;
    let controlGroupTCs: string = "";
    let colorsContainer: HTMLDivElement | null = null;
    //let setEventTab = false;
    for (const p of properties) {
      //setEventTab = p.tableMeta && p.tableMeta.tableType === "calendar-events" ? true : false;
      if (p.tabId && uih_currentTabId && uih_currentTabId.startsWith("#FORMFIELDS") && p.tabId !== uih_currentTabId) {
        // skip property, only on desktop where tabs are available 
        continue;
      }
      if (!p.tabId && (uih_currentTabId === "#FORMFIELDS1" || uih_currentTabId === "#FORMFIELDS2")) {
        // skip property, its in the default tab already
        continue;
      }
      t.push(JSON.stringify(p, undefined, 2));
      if (p.kind === "color" && state !== "document") {
        const twoColorProps = uih_currentProperties.length === 2 && uih_currentProperties.filter(p => p.kind === "color").length === 2 && printess.enableCustomColors();
        if (!colorsContainer) {
          colorsContainer = document.createElement("div");
          colorsContainer.className = "color-drop-down-list";
          if (twoColorProps) {
            colorsContainer.style.flexDirection = "column";
          }
          propsDiv.appendChild(colorsContainer);
        }
        if (twoColorProps) {
          const label = document.createElement("span");
          label.className = "mb-2";
          label.innerText = printess.gl("ui.color") + " " + (uih_currentProperties.findIndex(cp => cp.id === p.id) + 1);
          colorsContainer.appendChild(label);
        }
        colorsContainer.appendChild(getPropertyControl(printess, p))
      } else {
        colorsContainer = null;
        if (controlGroupDiv && p.controlGroup === controlGroup) {
          // add to current control group
          controlGroupTCs += getControlGroupWidth(p);
          controlGroupDiv.appendChild(getPropertyControl(printess, p));
        } else {
          if (controlGroupDiv) {
            // finalize control group
            propsDiv.appendChild(controlGroupDiv);
            controlGroupDiv.style.gridTemplateColumns = controlGroupTCs;
            controlGroupDiv = null;
            controlGroup = 0;
          }
          if (p.controlGroup) {
            // start new control group: 
            controlGroup = p.controlGroup;
            controlGroupDiv = document.createElement("div");
            controlGroupDiv.className = "control-group";
            // add to control group
            controlGroupTCs = getControlGroupWidth(p);
            controlGroupDiv.appendChild(getPropertyControl(printess, p));
          } else {
            // just add property 
            propsDiv.appendChild(getPropertyControl(printess, p));
          }
        }
      }
    }
    if (controlGroupDiv) {
      // finalize control group
      propsDiv.appendChild(controlGroupDiv);
      controlGroupDiv.style.gridTemplateColumns = controlGroupTCs;
      controlGroupDiv = null;
      controlGroup = 0;
    }

    return t;
  }

  function handleOffcanvasLayoutsContainer(printess: iPrintessApi, forMobile: boolean): void {
    const layoutsDiv = document.getElementById("layoutSnippets");

    const currentSnippets = uih_currentLayoutSnippets.map(g => g.name + "_" + g.snippets.length).join("|");
    const previousSnippets = uih_previousLayoutSnippets.map(g => g.name + "_" + g.snippets.length).join("|");
    const snippetsChanged = currentSnippets !== previousSnippets;

    if (layoutsDiv && snippetsChanged) {
      layoutsDiv.innerHTML = "";
      layoutsDiv.scrollTop = 0;
      layoutsDiv.appendChild(renderLayoutSnippets(printess, uih_currentLayoutSnippets, forMobile, false));
    }

    const showLayoutsButton = <HTMLButtonElement>document.querySelector(".show-layouts-button");
    if (showLayoutsButton) showLayoutsButton.style.visibility = "visible";
  }

  function getExternalSnippetsContainer(printess: iPrintessApi, forMobile: boolean): void {
    let layoutsDiv = document.getElementById("external-layouts-container");

    const currentSnippets = uih_currentLayoutSnippets.map(g => g.name + "_" + g.snippets.length).join("|");
    const previousSnippets = uih_previousLayoutSnippets.map(g => g.name + "_" + g.snippets.length).join("|");
    const snippetsChanged = currentSnippets !== previousSnippets;

    if (!layoutsDiv) {
      uih_previousLayoutSnippets = uih_currentLayoutSnippets;

      layoutsDiv = document.createElement("div");
      layoutsDiv.id = "external-layouts-container";

      const titleDiv = getPropertiesTitle(printess, true);
      const content = renderLayoutSnippets(printess, uih_currentLayoutSnippets, forMobile, false);

      if (!forMobile) layoutsDiv.appendChild(titleDiv);
      layoutsDiv.appendChild(content);
      document.body.appendChild(layoutsDiv);

    } else if (snippetsChanged && layoutsDiv) {
      uih_previousLayoutSnippets = uih_currentLayoutSnippets;

      layoutsDiv.innerHTML = "";
      const titleDiv = getPropertiesTitle(printess, true);
      const content = renderLayoutSnippets(printess, uih_currentLayoutSnippets, forMobile, false);

      if (!forMobile) layoutsDiv.appendChild(titleDiv);
      layoutsDiv.appendChild(content);
    }

    const layoutSnippetAmount = uih_currentLayoutSnippets.map(ls => ls.snippets.length).reduce((prev, curr) => prev + curr, 0);
    if (layoutSnippetAmount === 0) {
      layoutsDiv.style.display = "none";
    } else if (!forMobile) {
      layoutsDiv.style.display = "block";
    }
  }

  function removeExternalSnippetsContainer(): void {
    const layoutsDiv = document.getElementById("external-layouts-container");
    if (layoutsDiv) layoutsDiv.remove();
  }

  function getControlGroupWidth(p: iExternalProperty): string {
    if (p.kind === "label") {
      return "auto";
    } else if (p.validation?.maxChars) {
      return p.validation?.maxChars + "fr ";
    } else if (p.listMeta && p.listMeta.list.length > 0) {
      let c = 1;
      for (const itm of p.listMeta.list) {
        c = c < itm.label.length ? itm.label.length : c;
      }
      return (c) + "fr ";
    } else {
      return "10fr ";
    }
  }

  /**
   * Desktop Tabs Navigation
   */

  function getBuyerOverlayType(printess: iPrintessApi, properties: Array<{ kind: iExternalPropertyKind }>): string {

    const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
    const isImage = properties.filter(p => p.kind === "image").length > 0;
    const isColor = properties.filter(p => p.kind === "color").length > 0;
    const isStory = properties.filter(p => p.kind === "multi-line-text" || p.kind === "selection-text-style").length > 0;
    const hasFont = properties.filter(p => p.kind === "font").length > 0;

    const isText = hasFont || isSingleLineText || isStory || properties.length === 0;

    if (isText && isImage) {
      return printess.gl("ui.tabStickers");
    } else if (isText) {
      return printess.gl("ui.textFrame");
    } else if (isImage) {
      return printess.gl("ui.photoFrame");
    } else if (isColor) {
      return printess.gl("ui.color");
    }

    return "Sticker";

  }

  function getDesktopTabsContainer(printessDesktopGrid: HTMLElement): HTMLDivElement {
    let tabsContainer: HTMLDivElement | null = document.querySelector("div.tabs-navigation");

    if (!tabsContainer) {
      tabsContainer = document.createElement("div");
      tabsContainer.className = "tabs-navigation";
      printessDesktopGrid.appendChild(tabsContainer);
    }
    return tabsContainer;
  }
  function removeDesktopTabsContainer() {
    const tabsContainer: HTMLDivElement | null = document.querySelector("div.tabs-navigation");
    if (tabsContainer && tabsContainer.parentElement) {
      tabsContainer.parentElement.removeChild(tabsContainer);
    }
  }

  // Adjust Desktop View for Tab Navigation
  function adjustDesktopView(printess: iPrintessApi, desktopTitleOrSteps: HTMLDivElement, propsContainer: HTMLElement, printessDiv: HTMLElement, state: MobileUiState): void {

    if (printess.showTabNavigation()) {
      if (printess.hasPreviewBackButton()) {
        printessDiv.classList.add("preview-grid");
        propsContainer.style.display = "none";
      } else {
        printessDiv.classList.remove("preview-grid")
        propsContainer.style.display = "flex";
        propsContainer.style.height = "100%";
      }

      if (uih_currentTabId === "LOADING" || (uih_currentTabId === "#PHOTOS" && !printess.showPhotoTab())) {
        uih_currentTabId = printess.getInitialTabId();
      }

      const printessDesktopGrid = document.getElementById("printess-desktop-grid");
      if (printessDesktopGrid) {
        printessDesktopGrid.classList.add("main-tabs");
        if (printess.stepHeaderDisplay() !== "tabs list" && printess.pageNavigationDisplay() !== "icons" && printess.pageNavigationDisplay() !== "doc-tabs") {
          printessDesktopGrid.appendChild(desktopTitleOrSteps);
        } else {
          const desktopTitle: HTMLDivElement | null = document.querySelector("div.desktop-title-or-steps");
          if (desktopTitle) printessDesktopGrid.removeChild(desktopTitle);
        }

        const tabsContainer = getDesktopTabsContainer(printessDesktopGrid);
        const isBackgroundSelected = printess.isBackgroundSelected();

        if (isBackgroundSelected) {
          uih_currentTabId = "#BACKGROUND";

        } else {

          if (uih_currentTabId === "#BACKGROUND") {
            uih_currentTabId = "#NONE";
          }

          if (uih_currentTabId === "#NONE" && (state === "document" || uih_currentProperties.length === 0)) {
            // without properties, we always go back to inital tab
            uih_currentTabId = printess.getInitialTabId();
          }

          if (state === "document" && uih_currentTabId === "#NONE") {
            if (uih_currentProperties.length) {
              // invalid background tab or some other selected frames -> No Tab is selected 
              uih_currentTabId = "#FORMFIELDS"; // it doesn't if the tab exists or not 
            } else {
              uih_currentTabId = printess.getInitialTabId();
            }
          }

          if (state === "text" || (state === "frames" && uih_currentProperties.length)) {
            uih_currentTabId = "#NONE";
          }

          if (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "image") {
            const p = uih_currentProperties[0];
            if (p.value === p.validation?.defaultValue) {
              // only a single unassigned image -> show photos tab 
              //uih_currentTabId = "#PHOTOS";
            }
          }
        }

        renderTabsNavigation(printess, tabsContainer, false);

      }
    } else {
      removeDesktopTabsNavigation();
    }
  }

  function removeDesktopTabsNavigation() {
    const printessDesktopGrid = document.getElementById("printess-desktop-grid");
    if (printessDesktopGrid?.classList.contains("main-tabs")) {
      printessDesktopGrid.classList.remove("main-tabs");
      removeDesktopTabsContainer();
      const desktopTitle = document.querySelector(".desktop-title-or-steps");
      if (desktopTitle?.parentElement) {
        desktopTitle.parentElement.removeChild(desktopTitle);
      }
    }
  }
  function getSelectedTab(): iExternalTab | null {
    return uih_currentTabs.filter(t => t.id === uih_currentTabId)[0] || null;
  }

  function selectTab(printess: iPrintessApi, newTabId: string = ""): void {
    if (printess.showTabNavigation()) {
      if (newTabId === "") {
        newTabId = printess.getInitialTabId();
      }
      if (newTabId === "#NONE") {
        newTabId = "";
      }
      document.querySelectorAll("div.tabs-navigation li.nav-item.selected").forEach(i => i.classList.remove("selected"));
      uih_currentTabId = newTabId;
      if (newTabId) {
        const t = document.querySelector('div.tabs-navigation li.nav-item[data-tabid="' + newTabId + '"]');
        if (t) {
          t.classList.add("selected");
        }
      }
    }
  }

  function getPropertiesTitle(printess: iPrintessApi, forExternalLayoutsContainer: boolean = false): HTMLElement {
    const currentTab = uih_currentTabs.filter(t => t.id === uih_currentTabId)[0] || "";
    const hasFormFieldTab = uih_currentTabs.filter(t => t.id === "#FORMFIELDS").length > 0;
    const titleDiv = document.createElement("div");
    titleDiv.className = "properties-title";

    // Attach back arrow to return to formFields if available
    if (!hasFormFieldTab && !uih_currentTabId.startsWith("#FORMFIELDS") && printess.hasFormFields()) {
      const icon = printess.getIcon("arrow-left");
      const backButton = document.createElement("button");
      backButton.className = "btn btn-sm btn-outline-primary";
      backButton.onclick = () => {
        selectTab(printess, "#FORMFIELDS");
        printess.clearSelection();
      }
      backButton.appendChild(icon);
      titleDiv.appendChild(backButton);
      titleDiv.classList.remove("only-title");
    } else {
      titleDiv.classList.add("only-title");
    }

    const title = document.createElement("h3");

    let caption = "";
    if (forExternalLayoutsContainer) {
      caption = printess.gl("ui.changeLayout");
    } else if (uih_currentState === "text") {
      caption = printess.gl("ui.textFrame");
    } else if (uih_currentState === "frames") {
      caption = getBuyerOverlayType(printess, uih_currentProperties);
    } else if (currentTab) {
      caption = currentTab.head || currentTab.caption;
    }
    title.textContent = caption.replace(/\\n/g, "");
    titleDiv.appendChild(title);

    return titleDiv;
  }

  // Render vertical toolbar for tabs navigation on desktop
  function renderTabsNavigation(printess: iPrintessApi, tabsContainer: HTMLDivElement, forMobile: boolean): void {
    const tabs = uih_currentTabs;
    tabsContainer.innerHTML = "";
    const selected = getSelectedTab();

    const tabsToolbar = document.createElement("ul");
    tabsToolbar.className = "nav";

    if (!forMobile && tabsContainer.clientHeight - (120 * tabs.length) < 100) {
      tabsToolbar.style.height = "100%";
      tabsToolbar.style.justifyContent = "space-between";
    }

    for (const t of tabs) {
      if (t.id === "#PHOTOS" && !printess.showPhotoTab()) continue;
      if (forMobile && (t.id === "#BACKGROUND" || t.id.startsWith("#FORMFIELDS"))) continue;
      const tabItem = document.createElement("li");
      tabItem.className = "nav-item";
      tabItem.dataset.tabid = t.id;
      if (selected?.id === t.id) {
        tabItem.classList.add("selected");
      }
      // Set maximum height according to number of tabs and container height to avoid separation into two columns
      tabItem.style.maxHeight = forMobile ? "unset" : tabsContainer.clientHeight / tabs.length + "px";

      tabItem.onclick = () => {
        if (forMobile && t.id === uih_currentTabId) {
          closeMobileFullscreenContainer();
        }
        if (t.id !== uih_currentTabId) {
          uih_snippetsScrollPosition = 0;
        }
        selectTab(printess, t.id);
        if (t.id === "#BACKGROUND") {
          printess.selectBackground(); // triggers complete redraw with new Selection 
        } else if (t.id.startsWith("#FORMFIELDS")) {
          printess.clearSelection(); // its same right now, but we never know
        } else { // if (t.id !== "#PHOTOS") {
          printess.clearSelection(); // triggers complete redraw with new tab selected 
        }

        const externalLayoutsContainer = document.getElementById("external-layouts-container");
        if (externalLayoutsContainer && forMobile) {
          externalLayoutsContainer.classList.remove("open-external-layouts-container");
          if (t.id === "#LAYOUTS") {
            externalLayoutsContainer.classList.add("show-external-layouts-container");
          } else {
            externalLayoutsContainer.classList.remove("show-external-layouts-container");
          }
        }
      }

      const tabIcon = printess.getIcon(t.icon);
      tabIcon.classList.add("desktop-tab-icon");

      const tabLink = document.createElement("a");
      tabLink.className = "nav-link " + (selected?.id === t.id ? "active" : "");
      tabLink.innerHTML = t.caption.replace(/\\n/g, "<br>");

      tabItem.appendChild(tabIcon);

      // Only add Text to Tab Icons if enough space is available
      if (forMobile || tabsContainer.clientHeight / tabs.length > 100) {
        tabItem.appendChild(tabLink);
      } else {
        tabIcon.style.marginBottom = "10px";
      }

      tabsToolbar.appendChild(tabItem);
    }

    tabsContainer.appendChild(tabsToolbar);
  }

  // Show properties depending on selected tab
  function renderTabNavigationProperties(printess: iPrintessApi, container: HTMLElement, forMobile: boolean): void {

    switch (uih_currentTabId) {

      case "#PHOTOS": {
        const tabs = [{ title: printess.gl("ui.selectImage"), id: "select-images", content: renderMyImagesTab(printess, forMobile, undefined, undefined, undefined, printess.showSearchBar(), true) }];
        const groupSnippets = uih_currentGroupSnippets.filter(gs => gs.tabId === "#PHOTOS");

        // render tab panel if photo groupSnippets are available, else render only myImagesTab
        if (groupSnippets.length) {
          tabs.push({ title: printess.gl("ui.addPhotoFrame"), id: "photo-frames", content: renderGroupSnippets(printess, groupSnippets, forMobile) });
          container.appendChild(getTabPanel(tabs, "photo-frames"));
          container.scrollTop = uih_snippetsScrollPosition;
        } else {
          container.appendChild(renderMyImagesTab(printess, forMobile, undefined, undefined, undefined, printess.showSearchBar(), true));
        }

        break;
      }
      case "#LAYOUTS": {
        if ((<any>window).uiHelper.customLayoutSnippetRenderCallback) {
          getExternalSnippetsContainer(printess, forMobile);
        } else {
          removeExternalSnippetsContainer();

          const layoutsDiv = renderLayoutSnippets(printess, uih_currentLayoutSnippets, forMobile);
          container.appendChild(layoutsDiv);
          container.scrollTop = uih_snippetsScrollPosition;
        }
        break;
      }
      case "#BACKGROUND": {
        printess.selectBackground();
        break;
      }

      case "#FORMFIELDS":
      case "#FORMFIELDS1":
      case "#FORMFIELDS2":
        break;


      default: {
        const groupSnippets = uih_currentGroupSnippets.filter(gs => gs.tabId === uih_currentTabId);
        if (groupSnippets.length) {
          const snippetsDiv = renderGroupSnippets(printess, groupSnippets, forMobile);
          container.appendChild(snippetsDiv);
          container.scrollTop = uih_snippetsScrollPosition;
        }
        break;
      }
    }
  }

  /*
   * Renders a control for a given property 
   */
  function getPropertyControl(printess: iPrintessApi, p: iExternalProperty, metaProperty?: iExternalMetaPropertyKind, forMobile: boolean = false): HTMLElement {

    switch (p.kind) {

      /* case "background-button":
        return getChangeBackgroundButton(printess); */

      case "label":

        return getSimpleLabel(p.label, p.controlGroup > 0);

      case "checkbox":
        return getSwitchControl(printess, p, forMobile);

      case "single-line-text":
        return getSingleLineTextBox(printess, p, forMobile);

      case "font":
        return getFontDropDown(printess, p, forMobile);

      case "text-area":
        return getTextArea(printess, p, forMobile);

      case "multi-line-text":
      case "selection-text-style":
        if (forMobile) {
          switch (metaProperty) {
            case "text-style-color":
              return getColorDropDown(printess, p, "color", true);
            case "text-style-font":
              return getFontDropDown(printess, p, true)
            case "text-style-hAlign":
              return getHAlignControl(printess, p, true);
            case "text-style-size":
              return getFontSizeDropDown(printess, p, true);
            case "text-style-vAlign":
              return getVAlignControl(printess, p, true);
            case "text-style-vAlign-hAlign":
              return getVAlignAndHAlignControl(printess, p, true);
            case "text-style-paragraph-style":
              return getParagraphStyleDropDown(printess, p, true);

            case "handwriting-image":
              return getImageUploadControl(printess, p, undefined, forMobile);

            default:
              return getMultiLineTextBox(printess, p, forMobile)
          }
        } else if (p.kind === "selection-text-style") {
          return getInlineTextStyleControl(printess, p);
        } else {
          return getMultiLineTextBox(printess, p, forMobile);
        }


      case "color":
        if (!forMobile && uih_currentProperties.length <= 3 && uih_currentProperties.filter(p => p.kind === "color").length <= 1) {
          // render large version (mobile-version) of control
          return getTextPropertyScrollContainer(getColorDropDown(printess, p, undefined, true));
        } else if (!forMobile && uih_currentProperties.length === 2 && uih_currentProperties.filter(p => p.kind === "color").length === 2 && printess.enableCustomColors()) {
          const colorsContainer = getTextPropertyScrollContainer(getColorDropDown(printess, p, undefined, true));
          colorsContainer.classList.add("mb-4");
          return colorsContainer;
        } else {
          return getColorDropDown(printess, p, undefined, forMobile);
        }
      // return getColorControl(printess, p);

      case "number":
        return getNumberSlider(printess, p);

      case "image-id": // like image form field

        if (forMobile) {
          if (metaProperty) {
            switch (metaProperty) {

              case "image-rotation":
                return getImageRotateControl(printess, p, forMobile);

              case "image-crop":
                renderMobileDialogFullscreen(printess, "CROPMODAL", "ui.buttonCrop", getImageCropControl(printess, p, false));

            }
          }

          return getImageUploadControl(printess, p, undefined, forMobile);

        } else {

          // desktop 

          const tabs: Array<{ title: string, id: string, content: HTMLElement }> = [];
          if (p.imageMeta?.canUpload) {
            // select and upload
            tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) });
          } else {
            // only select image
            tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTabSelect"), content: getImageUploadControl(printess, p) });
          }
          if (p.imageMeta?.canUpload && p.value !== p.validation?.defaultValue) {
            // rotate and crop
            tabs.push({ id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p, forMobile) });
            if (p.imageMeta?.hasFFCropEditor) {
              tabs.push({ id: "crop-" + p.id, title: printess.gl("ui.cropTab"), content: getImageCropControl(printess, p, false, !forMobile) });
            }
          }
          const tabPanel = getTabPanel(tabs, p.id);
          tabPanel.style.display = printess.isPropertyVisible(p.id) ? "block" : "none";
          return tabPanel;
        }

      case "image": {
        if (forMobile) {
          if (metaProperty) {
            switch (metaProperty) {
              /*   case "handwriting-image": 
                   return getColorDropDown(printess, p,, forMobile);*/
              case "image-contrast":
                /* if (p.imageMeta && p.imageMeta.allows.indexOf("invert") >= 0) {
                   // render contrast & invert together 
                   const d = document.createElement("div");
                   d.style.display = "grid";
                   d.style.gridTemplateColumns = "1fr auto";
                   d.appendChild(getNumberSlider(printess, p, metaProperty, true));
                   d.appendChild(getInvertImageChecker(printess, p, "image-invert", forMobile));
                   return d;
                 }*/
                return getNumberSlider(printess, p, metaProperty, true);
              case "image-sepia":
              case "image-brightness":
              case "image-hueRotate":
              case "image-vivid":
                return getNumberSlider(printess, p, metaProperty, true);
              case "image-invert":
                // if (!p.imageMeta || p.imageMeta.allows.indexOf("invert") === -1) {
                return getInvertImageChecker(printess, p, "image-invert", forMobile);
              //  }
              //return document.createElement("div");
              case "image-placement":
                return getImagePlacementControl(printess, p, forMobile);
              case "image-scale":
                {
                  const div = document.createElement("div");
                  const s = getImageScaleControl(printess, p, true);

                  if (forMobile && s && p.imageMeta?.canSetPlacement) {
                    div.appendChild(getImagePlacementControl(printess, p, forMobile));
                    div.appendChild(s);
                    return div;
                  }
                  if (!s) return document.createElement("div");
                  return s;
                }
              case "image-rotation":
                return getImageRotateControl(printess, p, forMobile);
              case "image-filter":
                {
                  const tags = p.imageMeta?.filterTags;
                  if (tags && tags.length > 0) {
                    return getImageFilterButtons(printess, p, tags);
                  }
                }
                break;
            }
            const d = document.createElement("div");
            d.innerText = printess.gl("ui.missingControl");
            return d;
          } else {
            return getImageUploadControl(printess, p, undefined, forMobile);
          }
        }

        // desktop
        const tabs: Array<{ title: string, id: string, content: HTMLElement }> = [];

        if (p.imageMeta?.canUpload) {
          // select and upload
          tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) });
        } else {
          // only select image
          const title = p.imageMeta?.isHandwriting ? printess.gl("ui.imageTabHandwriting") : printess.gl("ui.imageTabSelect");
          tabs.push({ id: "upload-" + p.id, title: title, content: getImageUploadControl(printess, p) });
        }
        if (p.imageMeta?.canUpload && p.value !== p.validation?.defaultValue) {
          //filter and rotate 
          if (p.imageMeta?.allows.length > 2 && p.value !== p.validation?.defaultValue) {
            tabs.push({ id: "filter-" + p.id, title: printess.gl("ui.filterTab"), content: getImageFilterControl(printess, p) });
          }
          tabs.push({ id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p, forMobile) });
        }

        return getTabPanel(tabs, p.id);
      }

      case "select-list":
        return getDropDown(printess, p, forMobile);

      case "image-list":
      case "color-list":
        return getImageSelectList(printess, p, forMobile);

      case "table":
        return getTableControl(printess, p, forMobile);

    }


    const div = document.createElement("div");
    div.innerText = printess.gl("ui.missingProperty", p.kind);
    return div;

  }

  /*
   * All various controls rendering 
   */


  function getSimpleLabel(text: string, forControlGroup: boolean = false): HTMLElement {
    if (forControlGroup) {
      const para = document.createElement("para");
      para.style.marginTop = "38px";
      para.style.marginBottom = "0";
      para.style.marginLeft = "5px";
      para.style.fontSize = "16pt";
      para.textContent = text
      return para;
    } else {
      const para = document.createElement("p");
      para.className = "mb-1";
      para.textContent = text
      return para;
    }
  }

  function getSwitchControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
    const switchControl = document.createElement("div");
    switchControl.className = "form-check form-switch mb-3";

    const input = document.createElement("input");
    input.className = "form-check-input";
    input.id = p.id + "_switch";
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.checked = p.value === "true";

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", p.id + "_switch");
    label.textContent = printess.gl(p.label);

    switchControl.appendChild(input);

    if (!forMobile) {
      switchControl.appendChild(label);
    }

    switchControl.onchange = () => {
      printess.setProperty(p.id, input.checked ? "true" : "false").then(() => setPropertyVisibilities(printess));
      p.value = input.checked ? "true" : "false";

      const mobileButtonDiv = document.getElementById(p.id + ":");
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    }

    return switchControl;
  }

  function getChangeBackgroundButton(printess: iPrintessApi): HTMLElement {
    const ok = document.createElement("button");
    ok.className = "btn btn-primary w-100 align-self-start mb-3";
    ok.innerText = printess.gl("ui.buttonChangeBackground");
    ok.onclick = () => {
      printess.selectBackground();
    }
    return ok;
  }

  // button for desktop property navigation
  function getDesktopNavButton(btn: { name: string; text: string, task: (() => void) | (() => Promise<void>) }): HTMLButtonElement {
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.style.marginRight = "4px";
    ok.style.alignSelf = "start";
    ok.style.padding = "5px";
    ok.textContent = btn.text;
    ok.onclick = () => btn.task();
    return ok;
  }

  function getDoneButton(printess: iPrintessApi): HTMLElement {
    const buttons = {
      previous: {
        name: "previous",
        text: printess.gl("ui.buttonPrevStep"),
        task: () => {
          printess.previousStep();
          getCurrentTab(printess, (Number(printess.getStep()?.index) - 1), true);
        }
      },
      next: {
        name: "next",
        text: printess.gl("ui.buttonNext"),
        task: async () => {
          await gotoNextStep(printess);
          getCurrentTab(printess, (Number(printess.getStep()?.index) + 1), true);
        }
      },
      done: {
        name: "done",
        text: printess.gl("ui.buttonDone"),
        task: () => {
          const errors = printess.validate("selection");
          const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
          if (filteredErrors.length > 0) {
            getValidationOverlay(printess, filteredErrors, "done");
            return;
          }
          printess.clearSelection();
        }
      },
      basket: {
        name: "basket",
        text: printess.gl("ui.buttonBasket"),
        task: () => addToBasket(printess)
      }
    }

    const container = document.createElement("div");

    if (printess.isCurrentStepActive()) {

      if (printess.hasPreviousStep()) {
        container.appendChild(getDesktopNavButton(buttons.previous));
      }
      if (printess.hasNextStep()) {
        container.appendChild(getDesktopNavButton(buttons.next));
      } else {
        container.appendChild(getDesktopNavButton(buttons.basket));
      }

    } else if (!printess.isCurrentStepActive() && printess.hasSteps()) {

      container.appendChild(getDesktopNavButton(buttons.done));
      if (printess.hasNextStep()) {
        container.appendChild(getDesktopNavButton(buttons.next));
      } else {
        container.appendChild(getDesktopNavButton(buttons.basket));
      }

    } else if (!printess.showTabNavigation()) {
      container.appendChild(getDesktopNavButton(buttons.done));
    }

    return container;
  }

  /*
  function getColorControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
    const cp = document.createElement("input");
    cp.type = "color";
    cp.value = p.value.toString();
    cp.onchange = () => {
      printess.setProperty(p.id, cp.value)
    }
    return cp;
  }
  */

  function getFormTextStyleControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
    const textPropertiesDiv = document.createElement("div");
    textPropertiesDiv.classList.add("mb-3");

    if (!p.textStyle) {
      return textPropertiesDiv;
    }

    const group1 = document.createElement("div");

    group1.className = "input-group mb-3";
    const pre1 = document.createElement("div");
    pre1.className = "input-group-prepend";

    const hasColor = p.textStyle.allows.indexOf("color") >= 0;
    const hasSize = p.textStyle.allows.indexOf("size") >= 0;
    const hasFont = p.textStyle.allows.indexOf("font") >= 0;
    const hasVerticalAlign = p.textStyle.allows.indexOf("verticalAlignment") >= 0;
    const hasHorizontalAlign = p.textStyle.allows.indexOf("horizontalAlignment") >= 0;

    const displayColorControl = hasColor && (hasSize || hasFont || hasVerticalAlign || hasHorizontalAlign);

    if (displayColorControl) {
      getColorDropDown(printess, p, "color", false, pre1);
    }
    if (hasSize) {
      getFontSizeDropDown(printess, p, false, pre1, false);
    }

    group1.appendChild(pre1);

    if (hasFont) {
      getFontDropDown(printess, p, false, group1, false);
    }

    if (p.textStyle.allows.indexOf("styles") >= 0) {
      getParagraphStyleDropDown(printess, p, false, group1, false);
    }

    textPropertiesDiv.appendChild(group1);

    textPropertiesDiv.appendChild(getTextAlignmentControl(printess, p));

    return textPropertiesDiv;
  }

  function getInlineTextStyleControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
    const textPropertiesDiv = document.createElement("div");
    textPropertiesDiv.classList.add("mb-3");

    if (!p.textStyle) {
      return textPropertiesDiv;
    }

    if (p.textStyle.allows.indexOf("styles") >= 0) {
      textPropertiesDiv.appendChild(getTextPropertyScrollContainer(getParagraphStyleDropDown(printess, p, true, undefined, true)));
    }

    if (p.textStyle.allows.indexOf("font") >= 0) {
      const group1 = document.createElement("div");
      group1.className = "input-group mb-3";
      group1.appendChild(getFontDropDown(printess, p, false, undefined, true));
      textPropertiesDiv.appendChild(group1);
    }

    if (p.textStyle.allows.indexOf("color") >= 0) {
      textPropertiesDiv.appendChild(getTextPropertyScrollContainer(getColorDropDown(printess, p, "color", true)));
    }

    if (p.textStyle.allows.indexOf("size") >= 0) {
      textPropertiesDiv.appendChild(getTextPropertyScrollContainer(getFontSizeDropDown(printess, p, true, undefined, true)));
    }


    textPropertiesDiv.appendChild(getTextAlignmentControl(printess, p));

    if (p.kind === "selection-text-style" && p.textStyle.allows.indexOf("handWriting") >= 0) {
      const upload = getImageUploadButton(printess, p.id, false, true, "ui.uploadHandwriting");
      textPropertiesDiv.appendChild(upload);
    }

    return textPropertiesDiv;
  }

  function getTextPropertyScrollContainer(child: HTMLElement): HTMLDivElement {
    const d = document.createElement("div");
    d.className = "mb-3 text-large-properties";
    d.appendChild(child);
    return d;
  }


  function getTextAlignmentControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
    const group2 = document.createElement("div");
    if (p.textStyle && (p.textStyle.allows.indexOf("horizontalAlignment") >= 0 || p.textStyle.allows.indexOf("verticalAlignment") >= 0)) {

      group2.className = "input-group mb-3";
      group2.style.padding = "1px";
      group2.style.marginLeft = "0px";

      const pre2 = document.createElement("div");
      pre2.className = "input-group-prepend";

      if (p.textStyle.allows.indexOf("horizontalAlignment") >= 0) {
        group2.appendChild(getHAlignControl(printess, p, false));
      }

      const spacer = document.createElement("div");
      spacer.style.width = "10px";

      if (p.textStyle.allows.indexOf("horizontalAlignment") >= 0 && p.textStyle.allows.indexOf("verticalAlignment")) {
        group2.appendChild(spacer);
      }

      if (p.textStyle.allows.indexOf("verticalAlignment") >= 0) {
        group2.appendChild(getVAlignControl(printess, p, false));
      }

    }
    return group2;
  }

  function getMultiLineTextBox(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
    const ta = getTextArea(printess, p, forMobile);
    if (forMobile) {
      return ta;
    } else {
      const container = document.createElement("div");
      container.appendChild(getFormTextStyleControl(printess, p));
      container.appendChild(ta);
      return container;
    }
  }

  function getSingleLineTextBox(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = p.value.toString();
    inp.autocomplete = "off";
    inp.autocapitalize = "off";
    inp.spellcheck = false;
    if (p.validation && p.validation.maxChars) {
      inp.maxLength = p.validation.maxChars;
    }

    // Key-up does not fire when autocomplete happens
    inp.oninput = () => {
      printess.setProperty(p.id, inp.value).then(() => setPropertyVisibilities(printess));
      p.value = inp.value;
      validate(printess, p);

      const mobileButtonDiv = document.getElementById(p.id + ":");
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    }
    inp.onfocus = () => {
      const ffId = p.id.startsWith("FF_") ? p.id.substr(3) : undefined;
      printess.setZoomMode("frame");
      printess.resizePrintess(false, undefined, undefined, undefined, ffId);
      //printess.centerSelection(ffId);
      if (inp.value && p.validation && p.validation.clearOnFocus && inp.value === p.validation.defaultValue) {
        inp.value = "";
      } else {
        window.setTimeout(() => inp.select(), 0);
      }
    }
    inp.onblur = () => {
      printess.setZoomMode("spread");
    }

    const r = addLabel(printess, inp, p.id, forMobile, p.kind, p.label, !!p.validation?.maxChars && p.controlGroup === 0, p.controlGroup > 0);
    return r;

    /* window.setTimeout(() => {
       inp.focus();
     }, 100)*/

  }

  function getDesktopTitle(printess: iPrintessApi): HTMLElement {
    const container = document.createElement("div");

    const forCornerTools = printess.pageNavigationDisplay() === "icons";
    const basketBtnBehaviour = printess.getBasketButtonBehaviour();

    const inner = document.createElement("div");
    inner.className = "desktop-title-bar";
    if (!printess.showTabNavigation()) {
      inner.classList.add("mb-2");
    } else {
      inner.style.alignItems = "center";
    }

    if (!forCornerTools) {
      const h3 = document.createElement("h3");
      h3.innerText = printess.gl(printess.getTemplateTitle());
      h3.style.margin = "0px";
      h3.style.display = uih_currentPriceDisplay ? "none" : "hidden";
      inner.appendChild(h3);

      const priceDiv = document.createElement("div");
      priceDiv.className = "total-price-container";
      priceDiv.id = "total-price-display";
      if (uih_currentPriceDisplay) {
        getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
      } else if (printess.getProductInfoUrl()) {
        const infoIcon = printess.getIcon("info-circle");
        infoIcon.classList.add("product-info-icon");
        infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), printess.getProductInfoUrl(), false);
        priceDiv.appendChild(infoIcon);
      }
      inner.appendChild(priceDiv);
    }

    if (printess.hasPreviewBackButton()) {
      inner.appendChild(getPreviewBackButton(printess));
    } else if (basketBtnBehaviour === "go-to-preview") {
      const previewBtn = document.createElement("button");
      previewBtn.className = "btn btn-outline-primary";
      previewBtn.classList.add("me-1");
      if (printess.showTabNavigation() && printess.pageNavigationDisplay() !== "icons") {
        previewBtn.classList.add("ms-1");
      }
      previewBtn.innerText = printess.gl("ui.buttonPreview");
      previewBtn.onclick = async () => {
        const validation = await validateAllInputs(printess, "preview");
        if (validation) {
          await printess.gotoNextPreviewDocument(0);
          if (printess.showTabNavigation()) {
            printess.resizePrintess();
          }
        }
      }
      inner.appendChild(previewBtn);
    } else {
      inner.appendChild(document.createElement("div"));
    }

    const hasSaveAndCloseBtnInPageIconView = printess.pageNavigationDisplay() === "icons" && printess.showSaveAndCloseButton();
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "row";

    // if applicable render save and close button
    if (printess.showSaveAndCloseButton()) {
      const saveAndQuitButton = document.createElement("button");
      saveAndQuitButton.className = "btn btn-primary me-2";
      saveAndQuitButton.style.flex = "1 1 0";
      saveAndQuitButton.textContent = printess.gl("ui.buttonSaveAndClose");

      saveAndQuitButton.onclick = () => saveTemplate(printess, "close");
      wrapper.appendChild(saveAndQuitButton);
    }

    const basketBtn = document.createElement("button");
    const caption = hasSaveAndCloseBtnInPageIconView ? "" : printess.gl("ui.buttonBasket");
    basketBtn.className = "btn btn-primary d-flex justify-content-center";
    basketBtn.style.whiteSpace = "nowrap";
    if (!hasSaveAndCloseBtnInPageIconView && printess.pageNavigationDisplay() === "icons") {
      basketBtn.style.flex = "1 1 0";
    }

    basketBtn.innerText = caption;

    const basketIcon = <iconName>printess.gl("ui.buttonBasketIcon") || "shopping-cart-add";
    const icon = hasSaveAndCloseBtnInPageIconView ? basketIcon : <iconName>printess.gl("ui.buttonBasketIcon");
    if (icon) {
      const svg = printess.getIcon(icon);
      svg.style.height = "24px";
      svg.style.float = "left";
      svg.style.fill = "var(--bs-light)";

      // was "margin-right" but should be "margin-left" to have some distance to the icon. 
      svg.style.marginLeft = caption ? "10px" : "0px";
      basketBtn.appendChild(svg);
    }

    basketBtn.onclick = () => addToBasket(printess);

    if (!printess.showAddToBasketButton()) {
      wrapper.appendChild(document.createElement("div"));
    } else {
      wrapper.appendChild(basketBtn);
    }

    inner.appendChild(wrapper);

    container.appendChild(inner);

    if (!forCornerTools && !printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
      const hr = document.createElement("hr");
      container.appendChild(hr);
    }

    return container;
  }

  function getPreviewBackButton(printess: iPrintessApi): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary"; // me-1
    if (printess.pageNavigationDisplay() === "doc-tabs") {
      btn.classList.add("ms-2");
    } else if (printess.showTabNavigation() && printess.pageNavigationDisplay() !== "icons") {
      btn.classList.add("ms-1");
    } else {
      btn.classList.add("me-1");
    }
    const svg = printess.getIcon("arrow-left");
    svg.style.width = "18px";
    svg.style.verticalAlign = "sub";
    btn.appendChild(svg);
    btn.onclick = async () => {
      await printess.gotoPreviousPreviewDocument(0);
      if (printess.showTabNavigation()) {
        printess.resizePrintess();
      }
    }

    return btn;
  }
  function getExpertModeButton(printess: iPrintessApi, forMobile: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.id = "printess-expert-button";
    if (printess.pageNavigationDisplay() === "icons") {
      btn.className = "btn me-1 button-with-caption";
    } else if (forMobile) {
      btn.className = "btn me-2 button-mobile-with-caption";
    } else {
      btn.className = "btn me-2 button-with-caption";
    }
    if (printess.isInExpertMode()) {
      const btnClass = forMobile ? "btn-light" : "btn-primary";
      btn.classList.add(btnClass);
    } else {
      const btnClass = forMobile ? "btn-outline-light" : "btn-outline-primary";
      btn.classList.add(btnClass);
    }
    const svg = printess.getIcon("pen-swirl");
    btn.appendChild(svg);
    const txt = document.createElement("div");
    txt.textContent = "EXPERT";
    btn.appendChild(txt);
    btn.onclick = () => {
      if (printess.isInExpertMode()) {
        printess.leaveExpertMode();
        if (forMobile) {
          btn.classList.remove("btn-light");
          btn.classList.add("btn-outline-light");
        } else {
          btn.classList.remove("btn-primary");
          btn.classList.add("btn-outline-primary");
        }
      } else {
        printess.enterExpertMode();
        if (forMobile) {
          btn.classList.add("btn-light");
          btn.classList.remove("btn-outline-light");
        } else {
          btn.classList.add("btn-primary");
          btn.classList.remove("btn-outline-primary");
        }
      }
    }

    return btn;
  }
  function getSaveButton(printess: iPrintessApi, forMobile: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.id = "printess-save-button";
    if (printess.pageNavigationDisplay() === "icons") {
      btn.className = "btn me-1 button-with-caption";
    } else if (forMobile) {
      btn.className = "btn me-2 button-mobile-with-caption";
    } else {
      btn.className = "btn me-2 button-with-caption";
    }
    const btnClass = forMobile ? "btn-outline-light" : "btn-outline-primary";
    btn.classList.add(btnClass);
    const svg = printess.getIcon("cloud-upload-light");
    btn.appendChild(svg);
    const txt = document.createElement("div");
    txt.textContent = printess.gl("ui.buttonSave");
    btn.appendChild(txt);
    btn.onclick = async () => {
      btn.classList.add("disabled");
      saveTemplate(printess, "save");
      window.setTimeout(() => btn.classList.remove("disabled"), 1500);
    }

    return btn;
  }

  // get validation modal that displays external property errors
  function getValidationOverlay(printess: iPrintessApi, errors: Array<iExternalError>, buttonType: "done" | "next" | "preview" | "validateAll", stepIndex?: number): void {
    const error = errors[0];
    const imageResolutionErrors = errors.filter(e => e.errorCode === "imageResolutionLow");
    const modal = document.createElement("div");
    modal.id = "validation-modal";
    modal.className = "modal show align-items-center";
    modal.setAttribute("tabindex", "-1");
    modal.style.backgroundColor = "rgba(0,0,0,0.7)";
    modal.style.display = "flex";

    const dialog = document.createElement("div");
    dialog.className = "modal-dialog";
    //dialog.style.minWidth = "500px"; // not good, not responsive 

    const content = document.createElement("div");
    content.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header bg-primary";

    const title = document.createElement("h3");
    title.className = "modal-title";
    title.innerHTML = printess.gl(`errors.${error.errorCode}Title`).replace(/\n/g, "<br>")
    title.style.color = "#fff";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const ignore = document.createElement("button");
    ignore.className = "btn btn-outline-primary";
    ignore.textContent = printess.gl("ui.buttonIgnore");
    ignore.onclick = async () => {
      modal.style.display = "none";
      uih_ignoredLowResolutionErrors.push(error.boxIds[0]);
      modal.remove();

      errors.shift();
      if (errors.length > 0) {
        getValidationOverlay(printess, errors, buttonType, stepIndex);
        return;
      }

      if (stepIndex && buttonType === "next") {
        await gotoStep(printess, stepIndex);
      } else if (printess.hasNextStep() && buttonType === "next") {
        await gotoNextStep(printess);
      } else if (printess.getBasketButtonBehaviour() === "go-to-preview" && buttonType === "preview") {
        const validation = await validateAllInputs(printess, "preview");
        if (validation) {
          await printess.gotoNextPreviewDocument(0);
          if (printess.showTabNavigation()) {
            printess.resizePrintess();
          }
        }
      } else if (buttonType === "validateAll") {
        addToBasket(printess);
      } else {
        printess.clearSelection();
      }
    }

    // For low resolution errors when clicking on preview or basket button
    const ignoreAll = document.createElement("button");
    ignoreAll.className = "btn btn-outline-primary";
    ignoreAll.textContent = printess.gl("ui.buttonIgnoreAll");
    ignoreAll.onclick = async () => {
      modal.style.display = "none";
      imageResolutionErrors.forEach(err => uih_ignoredLowResolutionErrors.push(err.boxIds[0]));
      modal.remove();

      errors = errors.filter(err => err.errorCode !== "imageResolutionLow");
      if (errors.length > 0) {
        getValidationOverlay(printess, errors, buttonType, stepIndex);
        return;
      }

      if (buttonType === "preview") {
        const validation = await validateAllInputs(printess, "preview");
        if (validation) {
          await printess.gotoNextPreviewDocument(0);
          if (printess.showTabNavigation()) {
            printess.resizePrintess();
          }
        }
      } else if (buttonType === "validateAll") {
        addToBasket(printess);
      }
    }

    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = printess.gl("ui.buttonOk");
    ok.onclick = () => {
      printess.bringErrorIntoView(error);

      if (error.boxIds.length === 0 && printess.showTabNavigation()) {
        selectTab(printess, "#FORMFIELDS");
        //TODO: Find right form field tab? 
        printess.clearSelection();
      }

      modal.style.display = "none";
      modal.remove();

      window.setTimeout(() => {
        if (error.errorValue3) {
          const inp = document.getElementById("inp_FF_" + error.errorValue3);
          if (inp) inp.classList.add("input-error");

          const tab = document.getElementById("tabs-panel-FF_" + error.errorValue3);
          if (tab) tab.classList.add("image-missing");
        }
      }, 100);
    }

    const p = document.createElement("p");
    p.className = "error-message";
    p.textContent = `${printess.gl(`errors.${error.errorCode}`, error.errorValue1)}`;

    const hint = document.createElement("p");
    hint.className = "error-message";
    hint.innerHTML = `<b>[${error.errorValue2}]: </b>` + printess.gl("errors." + error.errorCode + "Short", error.errorValue1);

    const errorLink = document.createElement("p");
    errorLink.className = "text-primary d-flex align-items-center";
    const numberOfErrors = errors.length - 1 > 1 ? "errors.moreProblems" : "errors.oneMoreProblem";
    errorLink.textContent = printess.gl(numberOfErrors, (errors.length - 1));
    errorLink.style.marginBottom = "0px";

    const svg = printess.getIcon("angle-down-light");
    svg.style.width = "15px";
    svg.style.marginLeft = "15px";
    svg.style.cursor = "pointer";
    errorLink.appendChild(svg);

    const errorList = document.createElement("ul");
    errorList.className = "list-group list-group-flush error-list";
    for (let i = 1; i < errors.length; i++) {
      const item = document.createElement("li");
      const editBtn = printess.getIcon("edit");
      const errorText = "errors." + errors[i].errorCode + "Short";

      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.textContent = printess.gl(errorText, errors[i].errorValue1) + (errors[i].errorValue2 ? ` @ ${errors[i].errorValue2}` : '');

      editBtn.onclick = () => {
        printess.bringErrorIntoView(errors[i]);
        if (errors[i].boxIds.length === 0 && printess.showTabNavigation()) {
          selectTab(printess, "#FORMFIELDS");
          //TODO: Find right form field tab? 
          printess.clearSelection();
        }

        modal.style.display = "none";
        modal.remove();

        const errorId = errors[i].errorValue3;
        window.setTimeout(() => {
          if (errorId) {
            const inp = document.getElementById("inp_FF_" + errorId);
            if (inp) inp.classList.add("input-error");

            const tab = document.getElementById("tabs-panel-FF_" + errorId);
            if (tab) tab.classList.add("image-missing");
          }
        }, 100);
      }

      item.appendChild(editBtn);
      errorList.appendChild(item);
    }

    modalHeader.appendChild(title);
    modalBody.appendChild(p);

    if (error.errorValue2) {
      modalBody.appendChild(hint);
    }

    if (errors.length > 1) {
      let showErrorList = false;

      modalBody.appendChild(errorLink);

      svg.onclick = () => {
        showErrorList = !showErrorList;
        if (showErrorList) {
          modalBody.appendChild(errorList);
          svg.style.transform = "rotate(180deg)";
        } else if (!showErrorList && errorList) {
          modalBody.removeChild(errorList);
          svg.style.transform = "rotate(0deg)";
        }
      }
    }

    const validateAllLowResolution = buttonType === "preview" || buttonType === "validateAll";

    if (error.errorCode === "imageResolutionLow" || error.errorCode === "emptyBookPage") {
      footer.appendChild(ignore);
    }
    if (error.errorCode === "imageResolutionLow" && validateAllLowResolution && imageResolutionErrors.length > 1) {
      footer.appendChild(ignoreAll);
    }
    footer.appendChild(ok);
    content.appendChild(modalHeader);
    content.appendChild(modalBody);
    content.appendChild(footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
  }

  function getDesktopStepsUi(printess: iPrintessApi): HTMLElement {
    const container = document.createElement("div");

    const hr = document.createElement("hr");
    if (!printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
      container.appendChild(hr);
    }

    const grid = document.createElement("div");
    grid.className = "desktop-title-bar mb-2"; // d-flex align-items-center";



    const cur = printess.getStep();
    const hd = printess.stepHeaderDisplay();

    if (cur && printess.isCurrentStepActive() && hd !== "never") {

      if (hd === "only title" || hd === "title and badge") {
        grid.classList.add("active-step");
        if (hd === "only title") {
          grid.appendChild(document.createElement("div")); // placeholder for badge
        } else {
          grid.appendChild(getStepBadge((cur.index + 1).toString()));
        }
        const h2 = document.createElement("h2");
        h2.style.flexGrow = "1";
        h2.className = "mb-0";
        h2.style.display = uih_currentPriceDisplay ? "none" : "hidden";
        h2.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
        grid.appendChild(h2);

      } else if (hd === "badge list" || hd === "tabs list") {
        grid.classList.add("active-step");
        grid.appendChild(document.createElement("div")); // placeholder for badge
        const h2 = document.createElement("h2");
        h2.style.flexGrow = "1";
        h2.className = "mb-0";
        h2.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
        grid.appendChild(h2);
        /*   grid.classList.add("active-step-badge-list");
          grid.appendChild(getStepsBadgeList(printess)); // placeholder right align of buttons
          grid.appendChild(document.createElement("div"));
          grid.appendChild(getStepsPutToBasketButton(printess));
          container.appendChild(grid);
          container.appendChild(hr);
          return container; */

      } else {
        // badge Only / Badge List = badge between previous and text 
        grid.classList.add("active-step-only-badge");
        grid.appendChild(document.createElement("div")); // placeholder right align of buttons
      }

    } else {
      // render just the title
      grid.classList.add("steps");
      const h2 = document.createElement("h2");
      h2.style.flexGrow = "1";
      h2.style.display = uih_currentPriceDisplay ? "none" : "hidden";
      h2.className = "mb-0";
      h2.innerText = printess.getTemplateTitle();
      grid.appendChild(h2);
    }

    // render header  


    if (hd === "only badge" && cur && printess.isCurrentStepActive()) {
      const div = document.createElement("div");
      div.className = "step-n-of";

      const text1 = document.createElement("h2");
      text1.innerText = printess.gl("ui.step");

      const badge = getStepBadge((cur.index + 1).toString());

      const text2 = document.createElement("h2");
      text2.innerText = printess.gl("ui.of");

      const badge2 = getStepBadge(((printess.lastStep()?.index ?? 0) + 1).toString());
      badge2.classList.add("gray");

      div.appendChild(text1);
      div.appendChild(badge);
      div.appendChild(text2);
      div.appendChild(badge2);

      grid.appendChild(div);
    }

    const priceDiv = document.createElement("div");
    priceDiv.className = "total-price-container";
    priceDiv.id = "total-price-display";
    if (uih_currentPriceDisplay) {
      getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
    } else if (printess.getProductInfoUrl()) {
      const infoIcon = printess.getIcon("info-circle");
      infoIcon.classList.add("product-info-icon");
      infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), printess.getProductInfoUrl(), false);
      priceDiv.appendChild(infoIcon);
    }
    grid.appendChild(priceDiv);

    if (printess.hasPreviousStep()) {
      const prevStep = document.createElement("button");
      prevStep.className = "btn btn-outline-primary me-1";
      const svg = printess.getIcon("arrow-left");
      svg.style.width = "18px";
      svg.style.verticalAlign = "sub";
      prevStep.appendChild(svg);
      prevStep.onclick = () => printess.previousStep();
      grid.appendChild(prevStep);
    } else {
      grid.appendChild(document.createElement("div"));
    }

    if (printess.hasNextStep()) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "row";

      const nextStep = document.createElement("button");
      nextStep.className = "btn btn-outline-primary";
      if (printess.isNextStepPreview()) {
        nextStep.innerText = printess.gl("ui.buttonPreview");
      } else {
        const svg = printess.getIcon("arrow-right");
        svg.style.width = "18px";
        svg.style.verticalAlign = "sub";
        nextStep.appendChild(svg);
      }
      // nextStep.innerText = printess.isNextStepPreview() ? printess.gl("ui.buttonPreview") : printess.gl("ui.buttonNext");
      nextStep.onclick = async () => await gotoNextStep(printess);
      wrapper.appendChild(nextStep);

      // if applicable render save and close button
      if (printess.showSaveAndCloseButton()) {
        const saveAndQuitButton = document.createElement("button");
        saveAndQuitButton.className = "btn btn-primary ms-2 me-2";
        saveAndQuitButton.textContent = printess.gl("ui.buttonSaveAndClose");

        saveAndQuitButton.onclick = () => saveTemplate(printess, "close");
        wrapper.appendChild(saveAndQuitButton);
      }

      grid.appendChild(wrapper);

    } else {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "row";

      // if applicable render save and close button
      if (printess.showSaveAndCloseButton()) {
        const saveAndQuitButton = document.createElement("button");
        saveAndQuitButton.className = "btn btn-primary me-2";
        saveAndQuitButton.textContent = printess.gl("ui.buttonSaveAndClose");

        saveAndQuitButton.onclick = () => saveTemplate(printess, "close");
        wrapper.appendChild(saveAndQuitButton);
      }

      //instead of next step render basket button
      if (!printess.showAddToBasketButton()) {
        wrapper.appendChild(document.createElement("div"));
      } else {
        wrapper.appendChild(getStepsPutToBasketButton(printess));
      }

      grid.appendChild(wrapper);
    }


    container.appendChild(grid);

    if (!printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
      container.appendChild(hr);
    }

    return container;
  }

  function getStepBadge(content: HTMLElement | string): HTMLDivElement {
    const badge = document.createElement("div");
    badge.className = "step-badge";
    if (typeof content === "string") {
      badge.innerText = content;
    } else {
      badge.appendChild(content);
    }
    return badge;
  }

  function getCurrentTab(printess: iPrintessApi, value: number, forMobile: boolean = true): void {
    const isDocTabs = printess.pageNavigationDisplay() === "doc-tabs";
    const isStepTabsList = printess.stepHeaderDisplay() === "tabs list";
    const isStepBadgeList = printess.stepHeaderDisplay() === "badge list";

    if (isDocTabs || isStepTabsList || isStepBadgeList) {
      const tabsListScrollbar = <HTMLDivElement>document.getElementById("tabs-list-scrollbar");
      const curStepTab = <HTMLElement>document.getElementById("tab-step-" + value);
      setTabScrollPosition(tabsListScrollbar, curStepTab, forMobile);
    }
  }

  function setTabScrollPosition(tabsListScrollbar: HTMLDivElement, tab?: HTMLElement, forMobile?: boolean) {
    const stepTabs = document.getElementById("step-tab-list");
    uih_stepTabsScrollPosition = tabsListScrollbar.scrollLeft;

    if (stepTabs && tab && stepTabs.offsetWidth / tab.offsetLeft < 2) {
      if (forMobile) {
        uih_stepTabOffset = tab.offsetLeft - (stepTabs.offsetWidth / 2) + (tab.clientWidth / 2);
      } else {
        uih_stepTabOffset = tab.offsetLeft - (stepTabs.offsetWidth / 2) + 40 + (tab.clientWidth / 2);
      }
    } else {
      uih_stepTabOffset = 0;
    }
  }

  function getStepsTabsList(printess: iPrintessApi, _forMobile: boolean = false, displayType: "badge list" | "tabs list" | "doc tabs"): HTMLDivElement {

    const docs = displayType === "doc tabs" ? printess.getAllDocsAndSpreads() : []

    const div = document.createElement("div");
    div.className = "tabs-list";
    div.id = "tabs-list-scrollbar";

    const isDesktopTabs = (!_forMobile && (displayType === "tabs list" || displayType === "doc tabs"));
    const ul = document.createElement("ul");
    ul.className = "nav nav-tabs flex-nowrap " + (_forMobile ? "" : "step-tabs-desktop");
    if (displayType === "badge list") ul.style.borderBottomColor = "var(--bs-white)";

    if (displayType === "badge list" && _forMobile) {
      const prev = document.createElement("li");
      prev.className = "nav-item tab-item badge-item";
      const prevLink = document.createElement("a");
      prevLink.className = "nav-link badge-link prev-badge";
      if (!printess.hasPreviousStep()) prevLink.classList.add("disabled");
      const icon = printess.getIcon("carret-left-solid");
      icon.style.width = "25px";
      icon.style.height = "25px";
      icon.style.paddingRight = "2px";

      prev.onclick = () => {
        const curStepTab = <HTMLElement>document.getElementById("tab-step-" + (Number(printess.getStep()?.index) - 1))
        setTabScrollPosition(div, curStepTab, _forMobile);
        printess.previousStep();
      }

      prevLink.appendChild(icon);
      prev.appendChild(prevLink);
      ul.appendChild(prev);
    }

    let curIndex = -1;
    let maxIndex = 0;
    if (displayType === "doc tabs") {
      curIndex = 0;
      for (let idx = 0; idx < docs.length; idx++) {
        if (docs[idx].docId === printess.getCurrentDocumentId()) {
          curIndex = idx;
        }
      }
      maxIndex = docs.length - 1;
    } else {
      curIndex = printess.getStep()?.index ?? -1;
      maxIndex = printess.lastStep()?.index ?? 0
    }

    if (curIndex >= 0) {
      for (let i = 0; i <= (maxIndex); i++) {
        const tab = document.createElement("li");
        tab.className = "nav-item " + (isDesktopTabs ? "" : "tab-item");
        if (displayType === "badge list") tab.classList.add("badge-item");
        tab.id = "tab-step-" + i;

        const tabLink = document.createElement("a");
        tabLink.className = "nav-link text-truncate ";
        if (displayType === "badge list") tabLink.classList.add("badge-link");

        if (curIndex === i) {
          if (isDesktopTabs) {
            tab.classList.add("active");
            tabLink.classList.add("active");
          } else {
            tab.classList.add("active-step-tab");
            tabLink.classList.add("active-step-tablink");
          }
        } else {
          if (isDesktopTabs) {
            tab.classList.remove("active");
            tabLink.classList.remove("active");
          } else {
            tab.classList.remove("active-step-tab");
            tabLink.classList.remove("active-step-tab");
          }
        }

        let stepTitle = "";
        if (displayType === "doc tabs") {
          stepTitle = docs[i].docTitle;
        } else {
          stepTitle = printess.getStepByIndex(i)?.title ?? "";
        }
        tabLink.innerText = stepTitle.length === 0 || displayType === "badge list" ? (i + 1).toString() : stepTitle;
        tab.appendChild(tabLink);

        tab.onclick = async () => {
          const comingFromPreview = printess.hasPreviewBackButton();
          setTabScrollPosition(div, tab, _forMobile);
          if (displayType === "doc tabs") {
            // await printess.selectDocument(XX);
            await printess.selectDocumentAndSpread(docs[i].docId, 0)
          } else {
            await gotoStep(printess, i);
          }
          if (printess.hasPreviewBackButton()) {
            // indicates that we are in a preview step right now 
            printess.resizePrintess();
          }
          if (comingFromPreview) {
            printess.resizePrintess();
          }
        }
        ul.appendChild(tab);
      }
    }

    if (displayType === "badge list" && _forMobile) {
      const next = document.createElement("li");
      next.className = "nav-item tab-item badge-item";
      const nextLink = document.createElement("a");
      nextLink.className = "nav-link badge-link next-badge";
      if (!printess.hasNextStep()) nextLink.classList.add("disabled");
      const icon = printess.getIcon("carret-right-solid");
      icon.style.width = "25px";
      icon.style.height = "25px";
      icon.style.paddingLeft = "2px";

      next.onclick = () => {
        const curStepTab = <HTMLElement>document.getElementById("tab-step-" + (Number(printess.getStep()?.index) + 1))
        setTabScrollPosition(div, curStepTab, _forMobile);
        printess.nextStep();
      }

      nextLink.appendChild(icon);
      next.appendChild(nextLink);
      ul.appendChild(next);
    }

    scrollToLeft(div, uih_stepTabOffset, 300, uih_stepTabsScrollPosition);
    div.appendChild(ul);
    return div;
  }

  /*
  function getStepsBadgeList(printess: iPrintessApi, _forMobile: boolean = false): HTMLDivElement {

    const sm = ""; //  forMobile ? " step-badge-sm" :"";
    const div = document.createElement("div");
    div.className = "badge-list";

    const cur = printess.getStep();
    if (cur && printess.isCurrentStepActive()) {

      const prevBadge = document.createElement("div");
      prevBadge.className = "step-badge outline gray d-flex justify-content-center align-items-center" + sm;
      prevBadge.style.paddingRight = "2px";
      prevBadge.appendChild(printess.getIcon("carret-left-solid"));
      if (printess.hasPreviousStep()) {
        prevBadge.onclick = () => printess.previousStep();
        prevBadge.classList.add("selectable");
      } else {
        prevBadge.classList.add("disabled");
      }
      div.appendChild(prevBadge);


      for (let i = 0; i <= (printess.lastStep()?.index ?? 0); i++) {
        const badge = document.createElement("div");
        badge.className = "step-badge" + sm;
        if (cur.index !== i) {
          badge.classList.add("gray");
          badge.classList.add("selectable");
        }
        badge.innerText = (i + 1).toString();
        badge.onclick = () => gotoStep(printess, i);
        div.appendChild(badge);
      }

      const nextBadge = document.createElement("div");
      nextBadge.className = "step-badge outline gray d-flex justify-content-center align-items-center" + sm;
      nextBadge.style.paddingLeft = "2px";
      nextBadge.appendChild(printess.getIcon("carret-right-solid"));
      if (printess.hasNextStep()) {
        nextBadge.onclick = async () => await gotoNextStep(printess);
        nextBadge.classList.add("selectable");
      } else {
        nextBadge.classList.add("disabled");
      }
      div.appendChild(nextBadge);
    }
    return div;
  }
  */

  function getStepsPutToBasketButton(printess: iPrintessApi): HTMLButtonElement {
    // put to basket callback
    const basketButton = document.createElement("button");
    basketButton.className = "btn btn-primary";
    basketButton.style.whiteSpace = "nowrap";
    basketButton.innerText = printess.gl("ui.buttonBasket");
    basketButton.onclick = () => addToBasket(printess);
    return basketButton;
  }


  function getTextArea(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

    const inp = document.createElement("textarea");
    inp.value = p.value.toString();
    inp.autocomplete = "off";
    inp.rows = 6;
    inp.placeholder = printess.gl("errors.enterText");

    inp.oninput = async () => {
      await printess.setProperty(p.id, inp.value).then(() => setPropertyVisibilities(printess));
      p.value = inp.value;
      validate(printess, p);
      const mobileButtonDiv = document.getElementById(p.id + ":");
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    }
    inp.onfocus = () => {
      if (inp.value && p.validation && p.validation.clearOnFocus && inp.value === p.validation.defaultValue) {
        inp.value = "";
      } else {
        window.setTimeout(() => !printess.isIPhone() && inp.select(), 0);
      }
    }



    if (forMobile) {
      inp.className = "mobile-text-area";
      return addLabel(printess, inp, p.id, forMobile, p.kind, p.label);
    } else {
      inp.className = "desktop-text-area";
      return addLabel(printess, inp, p.id, forMobile, p.kind, p.label);
    }


  }

  function addLabel(printess: iPrintessApi, input: HTMLElement, id: string, forMobile: boolean, kind: iExternalPropertyKind, label?: string, hasMaxChars: boolean = false, inControlGroup: boolean = false): HTMLElement {
    input.classList.add("form-control");

    const container = document.createElement("div");
    !forMobile && container.classList.add("mb-3");
    container.id = "cnt_" + id;

    container.style.display = printess.isPropertyVisible(id) || kind === "image" ? "block" : "none";

    if (label) {
      if (label.trim() === "") label = "&nbsp;";
      const htmlLabel = document.createElement("label");
      htmlLabel.className = "form-label";
      htmlLabel.setAttribute("for", "inp_" + id.replace("#", "-HASH-"));
      htmlLabel.innerHTML = printess.gl(label) || "";
      htmlLabel.style.display = forMobile ? "none" : "inline-block";
      if (inControlGroup) {
        htmlLabel.style.fontSize = "0.85em";
        htmlLabel.style.opacity = "0.7";
      }

      if (kind === "image" && !forMobile) {
        const button = document.createElement("button");
        button.className = "btn btn-primary image-upload-btn";
        button.id = "upload-btn-" + id;
        htmlLabel.className = "image-upload-label";
        button.appendChild(htmlLabel);
        container.appendChild(button);
      } else if (kind === "image" && forMobile) {
        const upload = document.createElement("button");
        upload.className = "btn btn-outline-primary upload-image-btn";
        upload.id = "upload-btn-" + id;
        upload.textContent = printess.gl(label);
        upload.style.position = "relative";

        const uploadIcon = printess.getIcon("cloud-upload-light");
        uploadIcon.style.height = "50px";

        const uploadLabel = document.createElement("label");
        uploadLabel.className = "image-upload-label-mobile";
        uploadLabel.setAttribute("for", "inp_" + id.replace("#", "-HASH-"));

        upload.appendChild(uploadIcon);
        upload.appendChild(uploadLabel);
        container.appendChild(upload);
      } else {
        container.appendChild(htmlLabel);
      }
    }

    input.id = "inp_" + id.replace("#", "-HASH-");
    container.appendChild(input);

    const validation = document.createElement("div");
    validation.id = "val_" + id;
    validation.classList.add("invalid-feedback");
    validation.innerText = printess.gl("errors.textMissingInline");

    if (kind !== "image") container.appendChild(validation);
    if (hasMaxChars) getCharValidationLabel(printess, id, container);

    return container;
  }

  function getCharValidationLabel(printess: iPrintessApi, id: string, container: HTMLElement): void {
    const validation = document.createElement("div");
    validation.id = "char_" + id;
    validation.className = "chars-remaining";
    validation.innerText = "";
    if (container) container.appendChild(validation);
  }

  function validate(printess: iPrintessApi, p: iExternalProperty): void {
    if (p.validation) {
      const container = document.getElementById("cnt_" + p.id);
      const input = document.getElementById("inp_" + p.id.replace("#", "-HASH-"));
      const validation = document.getElementById("val_" + p.id);
      const charValidation = document.getElementById("char_" + p.id);

      if (charValidation && p.controlGroup === 0) {
        if (p.validation.maxChars && p.value.toString().length <= p.validation.maxChars && (p.value && p.value !== p.validation.defaultValue)) {
          charValidation.innerText = printess.gl("errors.maxCharsLeftInline", p.validation.maxChars - p.value.toString().length);
        } else {
          charValidation.innerText = "";
        }
      }

      if (container && input && validation) {

        if (p.validation.isMandatory && (!p.value || p.value === p.validation.defaultValue)) {
          // container.classList.remove("was-validated"); // add to activate BS-green-marker
          input.classList.add("is-invalid");
          validation.innerText = printess.gl("errors.enterText");
          return;
        }

        if (p.validation.maxChars) {
          if (p.value.toString().length > p.validation.maxChars) {
            // container.classList.remove("was-validated");// add to activate BS-green-marker
            input.classList.add("is-invalid");
            validation.innerText = printess.gl("errors.maxCharsExceededInline", p.validation.maxChars);
            return;
          }
        }

        if (p.kind === "multi-line-text") {
          // check if an overflow occured
          // story text is changed via debounce method, so we need to wait a little before checking for overflow
          window.setTimeout(() => {
            uih_lastOverflowState = printess.hasTextOverflow(p.id);
            if (uih_lastOverflowState) {
              input.classList.add("is-invalid");
              validation.innerText = printess.gl("errors.textOverflowShort");
            } else {
              input.classList.remove("is-invalid");
            }
          }, 500);

          if (uih_lastOverflowState) {
            input.classList.add("is-invalid");
            validation.innerText = printess.gl("errors.textOverflowShort");
            return;
          }
        }

        // container.classList.add("was-validated"); // add to activate BS-green-marker
        input.classList.remove("is-invalid");

      }
    }
    return;

  }

  function setPropertyVisibilities(printess: iPrintessApi) {
    // check if the change of one property influences the visibilities of other properties: 
    for (const p of uih_currentProperties) {
      if (p.validation && p.validation.visibility !== "always") {
        const div = document.getElementById("tabs-panel-" + p.id) || document.getElementById("cnt_" + p.id);
        if (div) {
          const v = printess.isPropertyVisible(p.id);
          if (v) {
            if (div.style.display === "none") {
              div.style.display = "block";
            }
          } else {
            //alert("huhu");
            div.style.display = "none";
          }
        } else {
          // mobile
          const div = document.getElementById(p.id + ":");
          if (div) {
            const v = printess.isPropertyVisible(p.id);
            if (v) {
              if (div.style.display === "none") {
                if (div.classList.contains("mobile-property-text")) {
                  div.style.display = "flex";
                } else {
                  div.style.display = "grid";
                }
              }
            } else {
              div.style.display = "none";
            }
          }
        }
      }
    }
  }

  function getImageSelectList(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
    const container = document.createElement("div");
    if (p.listMeta && p.listMeta.list) {

      const cssId = p.id.replace("#", "-");

      if (p.listMeta.imageCss) {
        const st = document.createElement("style");
        const css = p.listMeta.imageCss.replace(/\.image/g, ".image" + cssId);
        st.innerHTML = css.split("\n").join("");
        container.appendChild(st);
      }

      const imageListWrapper = document.createElement("div");
      imageListWrapper.classList.add("image-select-list-wrapper");
      const imageList = document.createElement("div");
      imageList.classList.add("image-select-list");

      for (const entry of p.listMeta.list) {
        const thumb = document.createElement("div");
        thumb.className = "no-selection image" + cssId;
        thumb.style.position = "relative";
        //thumb.title = printess.gl(entry.label);

        if (entry.imageUrl) {
          thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
        } else if (p.kind === "color-list") {
          thumb.style.backgroundColor = entry.key;
        }

        thumb.style.width = p.listMeta.thumbWidth + "px";
        thumb.style.height = p.listMeta.thumbHeight + "px";
        if (entry.key === p.value) thumb.classList.add("selected");

        thumb.onclick = () => {
          printess.setProperty(p.id, entry.key).then(() => setPropertyVisibilities(printess));
          imageList.childNodes.forEach((c) => (<HTMLDivElement>c).classList.remove("selected"));
          thumb.classList.add("selected");
          p.value = entry.key;
          const mobileButtonDiv = document.getElementById(p.id + ":");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
          }

        }

        const priceLabel = printess.getFormFieldPriceLabelByTag(entry.tag);
        if (priceLabel) {
          const priceBadge = document.createElement("div");
          priceBadge.className = "badge bg-primary";
          priceBadge.textContent = printess.gl(priceLabel);
          thumb.appendChild(priceBadge);
        }

        imageList.appendChild(thumb);
      }
      container.appendChild(imageList);
    }
    if (forMobile) {
      return container;
    } else {
      return addLabel(printess, container, p.id, forMobile, p.kind, p.label);
    }
  }

  function hexToRgb(hexColor: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    return result ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : hexColor;
  }


  function getColorDropDown(printess: iPrintessApi, p: iExternalProperty, metaProperty?: "color", forMobile: boolean = false, dropdown?: HTMLDivElement): HTMLElement {

    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.classList.add("btn-group");
    }

    const colors = printess.getColors(p.id);

    const button = document.createElement("button");

    const curColor = (metaProperty === "color" && p.textStyle) ? p.textStyle.color : p.value.toString();
    const curColorRgb = hexToRgb(curColor);

    if (!forMobile) {

      button.className = "btn btn-light dropdown-toggle btn-color-select"; // color-picker-button";
      //  button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");

      button.style.backgroundColor = curColor;

      if (p.value === "transparent") {
        const redLine = document.createElement("div");
        redLine.id = "red-line-" + p.id;
        redLine.className = "red-line-for-transparent-color";
        redLine.style.width = "33px";
        redLine.style.top = "18px";
        button.appendChild(redLine);
      }

      // button.innerHTML = "&nbsp;";
      dropdown.appendChild(button);
    }

    const ddContent = document.createElement("div");
    ddContent.className = "dropdown-menu";
    ddContent.setAttribute("aria-labelledby", "defaultDropdown");
    ddContent.style.width = "240px";

    const colorList = document.createElement("div");
    colorList.className = "color-picker-drop-down";
    if (forMobile) {
      colorList.style.paddingRight = "30px";
    }

    if (printess.enableCustomColors()) {
      colors.unshift({ name: "custom color_" + p.id, color: curColorRgb });
    }

    for (const f of colors) {
      const color = document.createElement("a");
      color.className = "color-picker-color dropdown-item";
      color.style.backgroundColor = f.color;
      color.dataset.color = f.name;
      color.title = f.name.includes("custom color") ? "custom color" : f.name;
      if (f.color === curColorRgb) {
        color.classList.add("selected");
      }
      if (f.color.toLowerCase() === "transparent") {
        const redLine = document.createElement("div");
        redLine.id = (f.name.includes("custom color") ? "custom-" : "") + "red-line-picker-" + p.id;
        redLine.className = "red-line-for-transparent-color";
        color.appendChild(redLine);
      }
      color.onclick = () => {
        setColor(printess, p, f.color, f.name.includes("custom color") ? color.style.backgroundColor : f.name, metaProperty);
        const colorInput = <HTMLInputElement>document.getElementById("hex-color-input_" + p.id);
        const hexColor = printess.getHexColor(f.color);
        if (colorInput && hexColor) colorInput.value = hexColor;
        colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
        color.classList.add("selected");
        if (!forMobile) {
          let redLine = <HTMLDivElement>document.getElementById("red-line-" + p.id);

          if (redLine && f.color !== "transparent") {
            redLine.remove();
          } else if (!redLine && f.color === "transparent") {
            redLine = document.createElement("div");
            redLine.id = "red-line-" + p.id;
            redLine.className = "red-line-for-transparent-color";
            redLine.style.width = "33px";
            redLine.style.top = "18px";
            button.appendChild(redLine);
          }

          button.style.backgroundColor = f.color;
        }
      }
      colorList.appendChild(color);
    }

    if (printess.enableCustomColors()) {
      colorList.appendChild(getCustomColorPicker(printess, p, forMobile, colorList, button, curColor, metaProperty));
    }

    if (forMobile) {
      return colorList;
    } else {
      ddContent.appendChild(colorList);
      dropdown.appendChild(ddContent);
      return dropdown;
    }
  }

  async function setColor(printess: iPrintessApi, p: iExternalProperty, color: string, name: string, metaProperty?: "color"): Promise<void> {
    if (metaProperty === "color") {
      printess.setTextStyleProperty(p.id, metaProperty, name);
      const mobileButtonDiv = document.getElementById(p.id + ":color") || document.getElementById(p.id + ":text-style-color");
      if (mobileButtonDiv && p.textStyle) {
        p.textStyle.color = color;
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    } else {
      await printess.setProperty(p.id, name).then(() => setPropertyVisibilities(printess));
      p.value = color;

      const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    }
  }

  function getCustomColorPicker(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean, colorList: HTMLDivElement, button: HTMLButtonElement, curColor: string, metaProperty?: "color"): HTMLElement {
    const hexGroup = document.createElement("div");
    hexGroup.className = "input-group input-group-sm mt-3 mb-2 ms-1 me-1 w-100";
    const hexPicker = document.createElement("span");
    hexPicker.className = "input-group-text";
    hexPicker.style.cursor = "pointer";
    const hexIcon = printess.getIcon("eye-dropper-light");
    hexIcon.style.height = "20px";
    const hexInput = document.createElement("input");
    hexInput.className = "form-control";
    hexInput.id = "hex-color-input_" + p.id;
    hexInput.type = "text";
    hexInput.placeholder = "#000000";
    hexInput.value = curColor;
    hexInput.maxLength = 7;
    const submitHex = document.createElement("button");
    submitHex.className = "btn btn-secondary";
    const checkHex = printess.getIcon("check");
    checkHex.style.height = "20px";

    submitHex.onclick = () => {
      const colorInput = <HTMLInputElement>document.getElementById("hex-color-input_" + p.id);
      const color = colorInput?.value;
      if (color) {
        const colorItem = <HTMLAnchorElement>document.querySelector(`a[data-color='custom color_${p.id}']`);
        if (colorItem) {
          colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
          colorItem.classList.add("selected");
          colorItem.style.backgroundColor = color;
        }
        setColor(printess, p, color, color, metaProperty);
        const redLine = document.getElementById("custom-red-line-picker-" + p.id);
        if (redLine) redLine.remove();

        if (!forMobile) {
          const buttonRedLine = <HTMLDivElement>document.getElementById("red-line-" + p.id);
          if (buttonRedLine) buttonRedLine.remove();
          button.style.backgroundColor = color;
        }
      }

    }

    hexPicker.onclick = async () => {
      const colorInput = <HTMLInputElement>document.getElementById("hex-color-input_" + p.id);
      try {
        //@ts-ignore
        const eyeDropper = new EyeDropper();
        const { sRGBHex: color } = await eyeDropper.open();
        //const c = Color.parseRgbColor(sRGBHex); ???
        if (color) {
          colorInput.value = color;
          const colorItem = <HTMLAnchorElement>document.querySelector(`a[data-color='custom color_${p.id}']`);
          if (colorItem) {
            colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
            colorItem.classList.add("selected");
            colorItem.style.backgroundColor = color;
          }
          setColor(printess, p, color, color, metaProperty);
          const redLine = document.getElementById("custom-red-line-picker-" + p.id);
          if (redLine) redLine.remove();

          if (!forMobile) {
            const buttonRedLine = <HTMLDivElement>document.getElementById("red-line-" + p.id);
            if (buttonRedLine) buttonRedLine.remove();
            button.style.backgroundColor = color;
          }
        }
      } catch (error) {
        alert("Sorry, eye-dropper tool is only available in Chrome Desktop.");
      }
    }

    hexPicker.appendChild(hexIcon);
    submitHex.appendChild(checkHex);
    hexGroup.appendChild(hexPicker);
    hexGroup.appendChild(hexInput);
    hexGroup.appendChild(submitHex);

    return hexGroup;
  }

  function getDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, fullWidth: boolean = true): HTMLElement {

    const dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    if (p.controlGroup > 0 && asList) dropdown.classList.add("dropup");

    const ddContent = document.createElement("ul");

    if (p.listMeta && p.listMeta.list) {
      const selectedItem = p.listMeta.list.filter(itm => itm.key === p.value)[0] ?? null;
      const button = document.createElement("button");
      button.className = "btn btn-light dropdown-toggle";
      if (fullWidth) {
        button.classList.add("full-width");
      }
      // button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");
      if (selectedItem) {
        button.appendChild(getDropdownItemContent(printess, p.listMeta, selectedItem))
      }
      dropdown.appendChild(button);

      if (asList) {
        ddContent.classList.add("list-group");
      } else {
        ddContent.classList.add("dropdown-menu");
        ddContent.setAttribute("aria-labelledby", "defaultDropdown");
        ddContent.style.width = "100%";
      }
      for (const entry of p.listMeta.list) {
        const li = document.createElement("li");
        if (asList) {
          li.classList.add("list-group-item");
          if (entry === selectedItem) {
            li.classList.add("active");
          }
        }
        const a = document.createElement("a");
        a.classList.add("dropdown-item");
        a.onclick = () => {
          p.value = entry.key;
          printess.setProperty(p.id, entry.key).then(() => {
            setPropertyVisibilities(printess);
            const mobileButtonDiv = document.getElementById(p.id + ":");
            if (mobileButtonDiv) {
              drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
            }
          });
          if (p.listMeta) {
            button.innerHTML = "";
            button.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
            if (asList) {
              ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
              li.classList.add("active")
            }
          }
        }
        a.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
        li.appendChild(a);
        ddContent.appendChild(li)
      }
      dropdown.appendChild(ddContent);
    }
    if (asList) {
      return ddContent;
    } else {
      return addLabel(printess, dropdown, p.id, false, p.kind, p.label, false, p.controlGroup > 0);
    }
  }

  function getDropdownItemContent(printess: iPrintessApi, meta: iExternalListMeta, entry: iExternalFieldListEntry): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("dropdown-list-entry");

    if (entry.imageUrl) {
      let tw = meta.thumbWidth;
      let th = meta.thumbHeight;
      const aspect = tw / th;
      if (th > 50) { // max for mobile
        th = 50;
        tw = th * aspect;
      }

      const img = document.createElement("div");
      img.classList.add("dropdown-list-image");
      img.style.backgroundImage = `url('${entry.imageUrl}')`;
      img.style.width = tw + "px";
      img.style.height = th + "px";
      img.style.marginRight = "10px";
      div.appendChild(img);
    }

    const label = document.createElement("div");
    label.classList.add("dropdown-list-label");
    label.innerText = printess.gl(entry.label);

    div.appendChild(label);

    const priceLabel = printess.getFormFieldPriceLabelByTag(entry.tag);
    if (priceLabel) {
      const priceBadge = document.createElement("div");
      priceBadge.className = "badge bg-primary";
      priceBadge.style.marginLeft = "auto";
      priceBadge.textContent = printess.gl(priceLabel);
      div.appendChild(priceBadge);
    }

    return div;
  }



  function getTabPanel(tabs: Array<{ title: string, id: string, content: HTMLElement }>, id: string): HTMLDivElement {

    const panel = document.createElement("div");
    panel.id = "tabs-panel-" + id;

    const ul = document.createElement("ul")
    ul.className = "nav nav-tabs";
    ul.setAttribute("role", "tablist");
    for (const t of tabs) {
      const li = document.createElement("li");
      li.className = "nav-item";
      li.style.cursor = "pointer";
      const a = document.createElement("a");
      a.className = "nav-link";
      a.innerText = t.title;
      a.dataset.bsToggle = "tab";
      a.dataset.bsTarget = "#tab-" + t.id;
      if (t === tabs[0]) {
        a.classList.add("active")
      }
      li.appendChild(a);
      ul.appendChild(li);
    }

    const content = document.createElement("div");
    content.className = "tab-content card";
    content.style.borderTop = "none";
    for (const t of tabs) {
      const pane = document.createElement("div");
      pane.id = "tab-" + t.id;
      pane.className = "tab-pane card-body fade";

      pane.setAttribute("role", "tabpanel");
      if (t === tabs[0]) {
        pane.classList.add("show")
        pane.classList.add("active")
      }

      pane.appendChild(t.content);
      content.appendChild(pane);
    }

    panel.appendChild(ul);
    panel.appendChild(content);
    return panel;

  }

  function getImageFilterButtons(printess: iPrintessApi, p: iExternalProperty, tags: readonly string[]): HTMLElement {

    const div = document.createElement("div");

    printess.getImageFilterSnippets(tags).then((snippets: Array<iExternalSnippet>) => {
      const filters = document.createElement("div");
      filters.className = "d-flex flex-wrap mb-3";
      for (const sn of snippets) {
        const img = document.createElement("div");
        img.className = "image-filter-snippet m-1 position-relative border border-dark text-center";
        img.style.backgroundImage = "url('" + sn.thumbUrl + "')";
        img.onclick = () => {
          printess.applyImageFilterSnippet(sn.snippetUrl);
        }

        const title = document.createElement("div");
        title.className = "image-filter-title";
        title.innerText = sn.title;

        img.appendChild(title);
        filters.append(img);
      }
      div.appendChild(filters);
    });

    return div;
  }

  function getImageFilterControl(printess: iPrintessApi, p: iExternalProperty, filterDiv?: HTMLDivElement, hasReset: boolean = true): HTMLElement {
    const container = filterDiv || document.createElement("div");

    const tags = p.imageMeta?.filterTags;
    if (tags && tags.length > 0) {
      container.appendChild(getImageFilterButtons(printess, p, tags));
    }

    /*** Effects ***/
    p.imageMeta?.allows.forEach(metaProperty => {
      switch (metaProperty) {
        case "brightness": container.appendChild(getNumberSlider(printess, p, "image-brightness")); break;
        case "contrast":
          if (p.imageMeta && p.imageMeta.allows.indexOf("invert") >= 0) {
            // render contrast & invert together 
            const d = document.createElement("div");
            d.style.display = "grid";
            d.style.gridTemplateColumns = "1fr auto";
            d.appendChild(getNumberSlider(printess, p, "image-contrast", true));
            d.appendChild(getInvertImageChecker(printess, p, "image-invert", false));
            container.appendChild(d);
          } else {
            container.appendChild(getNumberSlider(printess, p, "image-contrast"));
          }
          break;
        case "vivid": container.appendChild(getNumberSlider(printess, p, "image-vivid")); break;
        case "sepia": container.appendChild(getNumberSlider(printess, p, "image-sepia")); break;
        case "hueRotate": container.appendChild(getNumberSlider(printess, p, "image-hueRotate")); break;
        case "invert":
          if (!p.imageMeta || p.imageMeta.allows.indexOf("contrast") === -1) {
            container.appendChild(getInvertImageChecker(printess, p, "image-invert"));
          }
          break;
      }
    })

    if (hasReset) {
      const filterBtn = document.createElement("button");
      filterBtn.className = "btn btn-secondary mt-4 w-100";
      filterBtn.textContent = printess.gl("ui.buttonResetFilter");
      filterBtn.onclick = async () => {
        if (p.imageMeta) {
          p.imageMeta.brightness = 0;
          p.imageMeta.sepia = 0;
          p.imageMeta.hueRotate = 0;
          p.imageMeta.contrast = 0;
          p.imageMeta.vivid = 0;
          p.imageMeta.invert = 0;
          await printess.resetImageFilters(p.id, p.imageMeta);
        }
        container.innerHTML = "";
        getImageFilterControl(printess, p, container);
      }
      container.appendChild(filterBtn);
    }

    return container;
  }

  function getImageRotateControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
    const container = document.createElement("div");

    if (p.imageMeta && p.value !== "fallback" && (p.value !== p.validation?.defaultValue)) {
      const imagePanel = document.createElement("div");
      imagePanel.className = "image-rotate-panel";
      if (!forMobile) {
        imagePanel.classList.add("d-flex", "flex-column");
      }

      for (let i = 1; i < 4; i++) {

        const thumbDiv = document.createElement("div");
        thumbDiv.className = "snippet-thumb";
        if (!forMobile) {
          thumbDiv.classList.add("large");
        }
        const thumb = document.createElement("img");
        thumb.src = p.imageMeta.thumbUrl;
        thumbDiv.appendChild(thumb);

        thumbDiv.onclick = () => {
          const overlay = document.createElement("div");
          overlay.className = "image-rotate-overlay";

          const spinner = document.createElement("div");
          spinner.className = "spinner-border text-light";
          spinner.style.width = "3rem";
          spinner.style.height = "3rem";

          overlay.appendChild(spinner);
          container.appendChild(overlay);

          const rotAngle = (i * 90).toString();

          printess.rotateImage(p.id, <"90" | "180" | "270">rotAngle).finally(() => {
            imagePanel.innerHTML = "";
          })

          for (const c of [...imagePanel.childNodes]) {
            if (c !== thumbDiv) {
              (<HTMLDivElement>c).style.opacity = "0.4";
            } else {
              (<HTMLDivElement>c).style.border = "2px solid red";
            }
          }
        }

        thumbDiv.style.transformOrigin = "50% 50%";
        thumbDiv.style.transform = "rotate(" + i * 90 + "deg)"

        imagePanel.appendChild(thumbDiv);
      }

      container.appendChild(imagePanel);
    } else {
      container.innerText = printess.gl("ui.selectImageFirst");
    }

    return container;
  }

  function hideModal(id: string): void {
    const modal = document.getElementById(id);
    if (modal) {
      document.body.removeChild(modal);
    }
  }
  function showModal(printess: iPrintessApi, id: string, content: HTMLDivElement, titelHtml: string, footer?: HTMLDivElement) {

    const modal = document.createElement("div");

    modal.className = "modal show align-items-center";
    modal.id = id;
    modal.setAttribute("tabindex", "-1");
    modal.style.backgroundColor = "rgba(0,0,0,0.7)";
    modal.style.display = "flex";
    modal.style.width = "100%";
    modal.style.height = "100%";

    const dialog = document.createElement("div");
    dialog.className = "modal-dialog";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header bg-primary";

    const title = document.createElement("h3");
    title.className = "modal-title";
    title.innerHTML = titelHtml;
    title.style.color = "#fff";

    const closer = printess.getIcon("close");
    closer.classList.add("modal-closer-icon");
    closer.onclick = () => {
      hideModal(id);
    }

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.padding = "1.75rem";
    modalBody.appendChild(content);
    modalHeader.appendChild(title);
    if (id !== "layoutSnippetsSelection") {
      modalHeader.appendChild(closer);
    }
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    if (footer) modalContent.appendChild(footer);

    dialog.appendChild(modalContent);
    modal.appendChild(dialog);

    document.body.appendChild(modal);

  }

  function getImageCropControl(printess: iPrintessApi, p: iExternalProperty, showSkipBtn: boolean, forDesktopDialog: boolean = false): HTMLDivElement {
    const container = document.createElement("div");
    if (p) {

      const ui = printess.createCropUi(p.id, forDesktopDialog);
      if (!ui) {
        container.innerText = printess.gl("ui.selectImageFirst");
        return container;
      }
      ui.container.classList.add("mb-3");

      const rangeLabel = document.createElement("label");
      rangeLabel.id = "range-label"
      const range: HTMLInputElement = document.createElement("input");
      range.className = "form-range";
      range.type = "range";
      range.min = "1";
      range.max = "5";
      range.step = "0.01";
      range.value = "1"
      const span = document.createElement("span");
      if (p.imageMeta) {
        span.textContent = printess.gl("ui.scale");
      }
      rangeLabel.appendChild(span);
      rangeLabel.appendChild(range);
      rangeLabel.classList.add("mb-3")
      range.oninput = () => {
        const newScale = parseFloat(range.value);
        ui.setScale(newScale);
      }

      const skipBtn = document.createElement("button");
      skipBtn.className = "btn btn-outline-primary mb-3 me-2";
      skipBtn.innerText = printess.gl("ui.buttonSkip");
      skipBtn.onclick = () => {
        hideModal("CROPMODAL");
      }

      const okBtn = document.createElement("button");
      okBtn.className = "btn btn-primary mb-3"; // my-3 w-100";
      okBtn.innerText = printess.gl("ui.applyChanges");
      okBtn.onclick = async () => {
        const spinner = document.createElement("span");
        spinner.className = "spinner-border spinner-border-sm me-3";

        const spinnerText = document.createElement("span");
        spinnerText.textContent = printess.gl("ui.cropping");

        okBtn.textContent = "";
        okBtn.appendChild(spinner);
        okBtn.appendChild(spinnerText);
        okBtn.classList.add("disabled");

        await printess.cropImage(p.id, ui.getCropBox());

        hideModal("CROPMODAL");
      };

      container.appendChild(rangeLabel);
      container.appendChild(ui.container);
      if (showSkipBtn) {
        container.appendChild(skipBtn);
      }
      container.appendChild(okBtn);

    }

    return container;
  }




  function getImageUploadControl(printess: iPrintessApi, p: iExternalProperty, container?: HTMLDivElement, forMobile: boolean = false): HTMLElement {

    // for redraw after upoad, take passed container instead
    container = container || document.createElement("div");
    container.innerHTML = "";

    /**** IMAGE UPLOAD ****/

    const imagePanel = document.createElement("div");
    imagePanel.className = "image-panel";
    imagePanel.id = "image-panel" + p.id;

    /* if on desktop and only a single property is present render "my-images" instead of compact image control */

    const images = printess.getImages(p.id);
    const imageList = document.createElement("div");

    if (forMobile || (uih_currentProperties.length < 5 && uih_currentProperties.filter(p => p.kind === "image" || p.kind === "image-id").length <= 1)) {

      /*** SCALE ***/
      if (!forMobile) {

        if (p.imageMeta && p.imageMeta.allows.length <= 2 && p.value !== p.validation?.defaultValue) {
          const filtersControl = getImageFilterControl(printess, p, undefined, false);
          filtersControl.classList.add("mb-3");
          container.appendChild(filtersControl);
        }

        const placementControl: HTMLElement | null = getImagePlacementControl(printess, p, forMobile);
        if (placementControl && p.imageMeta?.canSetPlacement && p.value !== p.validation?.defaultValue) {
          container.appendChild(placementControl);
        }

        const scaleControl: HTMLElement | null = getImageScaleControl(printess, p);
        if (scaleControl) {
          scaleControl.classList.add("mb-3");
          container.appendChild(scaleControl);
        }
      }
      if (p.imageMeta?.isHandwriting === true) {
        const b = document.createElement("button");
        b.className = "btn btn-primary";
        b.innerText = "Back to text editing";
        b.onclick = () => {
          printess.removeHandwritingImage();
        }
        imagePanel.appendChild(b);
      } else {
        if (forMobile) {
          imagePanel.appendChild(renderImageControlButtons(printess, images, p))
        } else {
          imagePanel.appendChild(renderMyImagesTab(printess, forMobile, p, images));
        }
      }
      imagePanel.style.gridTemplateRows = "auto";
      imagePanel.style.gridTemplateColumns = "1fr";
      container.appendChild(imagePanel);
      return container;

    } else {

      if (p.imageMeta?.canUpload) {
        container.appendChild(getImageUploadButton(printess, p.id, forMobile, true));
      }

      const imageListWrapper = document.createElement("div");
      imageListWrapper.classList.add("image-list-wrapper");

      imageList.classList.add("image-list");

      const mainThumb = document.createElement("div");
      if (p.imageMeta?.thumbCssUrl) {
        mainThumb.className = "main";
        mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
        imagePanel.appendChild(mainThumb);
      }
      for (const im of images) {
        const thumb = document.createElement("div");
        thumb.style.backgroundImage = im.thumbCssUrl;
        if (im.id === p.value) thumb.style.border = "2px solid red";
        thumb.onclick = async () => {

          const scaleHints = await printess.setProperty(p.id, im.id);
          p.value = im.id;
          if (scaleHints && p.imageMeta) {
            p.imageMeta.scaleHints = scaleHints;
            p.imageMeta.scale = scaleHints.scale;
            p.imageMeta.thumbCssUrl = im.thumbCssUrl;
            p.imageMeta.thumbUrl = im.thumbUrl;
            p.imageMeta.canScale = printess.canScale(p.id);
          }

          //  const newImages = printess.getImages(p?.id);
          //  renderMyImagesTab(printess, forMobile, p, newImages, container);

          getImageUploadControl(printess, p, container, forMobile);

          const propsDiv = document.getElementById("tabs-panel-" + p.id);
          if (propsDiv) {
            propsDiv.replaceWith(getPropertyControl(printess, p));
          }

          if (forMobile) closeMobileFullscreenContainer();

          // validate(printess, p);
        }
        imageList.appendChild(thumb);
      }
      imageListWrapper.appendChild(imageList);
      imagePanel.appendChild(imageListWrapper)

      if (forMobile) {
        container.classList.add("form-control");
        container.appendChild(imageList);
        return container;
      } else {
        container.appendChild(imagePanel);

        /** Image Placement ***/
        const placementControl: HTMLElement | null = getImagePlacementControl(printess, p, forMobile);
        if (placementControl && p.imageMeta?.canSetPlacement && p.value !== p.validation?.defaultValue) {
          container.appendChild(placementControl);
        }

        /*** SCALE ***/
        const scaleControl: HTMLElement | null = getImageScaleControl(printess, p);
        if (scaleControl) {
          container.appendChild(scaleControl);
        }
        return container;
      }

    }
  }

  function getImageUploadButton(printess: iPrintessApi, id: string, forMobile: boolean = false, assignToFrameOrNewFrame: boolean = true, label: string = ""): HTMLDivElement {
    const container = document.createElement("div");

    /***+ IMAGE UPLOAD ****/
    /* const fileUpload = document.createElement("div");
    if (addBottomMargin) fileUpload.className = "mb-3";
    fileUpload.id = "cnt_" + id; */

    const progressDiv = document.createElement("div");
    progressDiv.className = "progress";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.style.width = "0%";
    progressDiv.style.display = "none";
    progressDiv.appendChild(progressBar);

    const inp = document.createElement("input");
    inp.type = "file";
    inp.id = "inp_" + id.replace("#", "-HASH-");
    inp.className = "form-control"
    inp.accept = `image/png,image/jpg,image/jpeg${printess.allowPdfUpload() ? ",application/pdf" : ""}`; // do not add pdf or svg, since it cannot be rotated!!
    inp.multiple = !id.startsWith("FF_");
    inp.style.display = "none";
    inp.onchange = async () => {

      // printess.setProperty(p.id, inp.value);
      if (inp && inp.files?.length) {
        inp.disabled = true;
        inp.style.display = "none";

        const imageQualityInfoText = document.getElementById("image-quality-info");
        if (imageQualityInfoText) imageQualityInfoText.style.display = "none";
        const scaleControl = document.getElementById("range-label");
        if (scaleControl) scaleControl.style.display = "none";
        // const imagePanel = document.getElementById("image-panel" + id);
        // if (imagePanel) imagePanel.style.display = "none";
        const twoButtons = document.getElementById("two-buttons");
        if (twoButtons) twoButtons.style.gridTemplateColumns = "1fr";
        const distributeBtn = document.getElementById("distribute-button");
        if (distributeBtn) distributeBtn.style.display = "none";
        const multipleImagesHint = document.getElementById("multiple-images-hint");
        if (multipleImagesHint) multipleImagesHint.style.display = "none";

        // remove upload and change buttons and replace with progress bar on mobile
        const imageControl = document.getElementById("image-control-buttons");
        if (imageControl && forMobile) {
          imageControl.innerHTML = "";
          imageControl.style.gridTemplateColumns = "1fr";
          imageControl.appendChild(progressDiv);
        }

        // display progress bar
        progressDiv.style.display = "flex";

        const label = document.getElementById("upload-btn-" + id);
        if (label) {
          label.style.display = "none";
        }

        // can upload multiple files at once
        const newImg = await printess.uploadImages(inp.files, (progress) => {
          progressBar.style.width = (progress * 100) + "%"
        }
          , assignToFrameOrNewFrame, id); // true auto assigns image and triggers selection change which redraws this control.

        // distribute images between the different frames on upload
        if (printess.getImages().length > 0 && printess.allowImageDistribution() && inp.files.length > 1) {
          //const imagesContainer = <HTMLDivElement>document.getElementById("image-tab-container");
          //getDistributionOverlay(printess, forMobile, uih_currentProperties[0], imagesContainer);
          await printess.distributeImages()
        } else if (!assignToFrameOrNewFrame && newImg && newImg.length > 0) {
          // assign to next available frame 
          printess.assignImageToNextPossibleFrame(newImg[0].id)
        }


        // optional: promise resolution returns list of added images 
        // if auto assign is "false" you must reset progress-bar width and control visibilty manually
        // .then(images => {console.log(images)};

        if (!assignToFrameOrNewFrame) {
          const imageTabContainer = <HTMLDivElement>document.getElementById("tab-my-images");
          if (imageTabContainer) {
            imageTabContainer.innerHTML = "";
            imageTabContainer.appendChild(renderMyImagesTab(printess, forMobile));
          }
        }

        if (id.startsWith("FF_")) {
          const p = uih_currentProperties.filter(p => p.id === id && p.kind === "image-id");
          if (p.length > 0 && p[0].imageMeta?.hasFFCropEditor) {
            if (forMobile) {
              renderMobileDialogFullscreen(printess, "CROPMODAL", "ui.buttonCrop", getImageCropControl(printess, p[0], true));
            } else {
              showModal(printess, "CROPMODAL", getImageCropControl(printess, p[0], true, true), printess.gl("ui.buttonCrop"));
            }
          }
        }

        // set current image group to Buyer Uploads to open respective category
        uih_activeImageAccordion = "Buyer Upload";

        if (printess.showTabNavigation()) {
          closeMobileFullscreenContainer();
        }
      }
    }

    container.appendChild(progressDiv);
    container.appendChild(addLabel(printess, inp, id, forMobile, "image", label || "ui.changeImage"));

    return container;
  }

  function getImagePlacementControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean, container?: HTMLDivElement): HTMLElement {
    const placementControls: { name: "fit" | "fill" | "face" | "group", icon: iconName }[] = [{
      name: "fit",
      icon: "fit-image",
    }, {
      name: "fill",
      icon: "fill-image"
    }, {
      name: "face",
      icon: "focus-face"
    }, {
      name: "group",
      icon: "focus-group"
    }];

    if (!container) {
      container = document.createElement("div");
      container.className = "image-placement-container mb-3";
    } else {
      container.innerHTML = "";
    }



    for (const pc of placementControls) {
      const button = document.createElement("button");
      button.className = "btn image-placement-button";
      const txt = document.createElement("div");
      txt.textContent = printess.gl("ui.placement-" + pc.name);
      const icon = printess.getIcon(pc.icon);
      icon.style.width = "30px";
      icon.style.height = "30px";

      if (p.imageMeta?.placement === pc.name) {
        button.classList.add("btn-primary");
      } else {
        button.classList.add("btn-outline-primary");
      }

      button.appendChild(icon);
      button.appendChild(txt);

      button.onclick = async () => {
        const scaleHints = await printess.setImagePlacement(pc.name, p.id);
        if (scaleHints && p.imageMeta) {
          p.imageMeta.scaleHints = scaleHints;
          p.imageMeta.scale = scaleHints.scale;
          p.imageMeta.placement = pc.name;

          getImagePlacementControl(printess, p, forMobile, container);
          const scaleControl = <HTMLDivElement>document.getElementById("range-label");
          if (scaleControl) {
            //TODO: Add for Mobile
            getImageScaleControl(printess, p, forMobile, scaleControl);
          }
        }

      }

      container.appendChild(button);
    }

    return container;
  }

  function getImageScaleControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean = false, element?: HTMLDivElement): HTMLElement | null {
    if (!p.imageMeta?.canScale || p.validation?.defaultValue === p.value) {
      return null;
    }
    if (p.kind === "image-id" || !p.imageMeta) {
      // no scalling for form fileds
      return null;
    }
    if (element) {
      element.innerHTML = "";
    }
    const rangeLabel = element || document.createElement("label");
    rangeLabel.id = "range-label"
    const range: HTMLInputElement = document.createElement("input");
    range.className = "form-range";
    if (forMobile) range.style.marginLeft = "0px";

    if (printess.isIPhone()) {
      range.classList.add("slider-catch-radius");
    }

    range.type = "range";
    range.min = p.imageMeta?.scaleHints.min.toString() ?? "0";
    range.max = p.imageMeta?.scaleHints.max.toString() ?? "0";
    range.step = "0.01";
    range.value = p.imageMeta?.scale.toString() ?? "0";

    const span = document.createElement("span");
    span.textContent = forMobile ? "" : printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale));

    if (p.imageMeta) {
      const maxScale = Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scaleHints.max);
      const minScale = Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scaleHints.min);
      const veryLowQuality = p.imageMeta.scaleHints.max < 0.8;
      const lowQuality = p.imageMeta.scaleHints.max < p.imageMeta.scaleHints.min;

      if (minScale - maxScale < 15) {
        rangeLabel.id = "image-quality-info";
        rangeLabel.classList.add("align-items-center");
        rangeLabel.style.display = "flex";
        range.style.display = "none";

        let icon = printess.getIcon("warning");
        icon.classList.add("scale-warning");

        if (veryLowQuality) {
          span.textContent = printess.gl("ui.imageVeryLowQuality");
          span.style.color = "red";
          icon.style.color = "red";

        } else if (lowQuality) {
          span.textContent = printess.gl("ui.imageLowQuality");
          span.style.color = "orange";
          icon.style.color = "orange";

        } else {
          icon = printess.getIcon("check-circle-solid");
          icon.classList.add("scale-warning");
          span.textContent = printess.gl("ui.imageGoodQuality");
          span.style.color = "green";
          icon.style.color = "green";
        }

        if (forMobile) span.style.fontSize = "12px";
        rangeLabel.appendChild(icon);
        rangeLabel.appendChild(span);
      } else if (!forMobile) {
        rangeLabel.appendChild(span);
      }
    }

    rangeLabel.appendChild(range);
    if (forMobile) {
      rangeLabel.classList.add("form-control")
    }

    range.oninput = () => {
      const newScale = parseFloat(range.value);
      printess.setImageMetaProperty(p.id, "scale", newScale);
      if (p.imageMeta) {
        p.imageMeta.scale = newScale;
        span.textContent = forMobile ? "" : printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale));
        const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
        if (mobileButtonDiv) {
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
        }

      }
    }

    return rangeLabel;
  }

  function getInvertImageChecker(printess: iPrintessApi, p: iExternalProperty, metaProperty: "image-invert", forMobile: boolean = false): HTMLElement {

    if (forMobile) {
      return getInvertImageCheckerMobile(printess, p, metaProperty, forMobile);
    }
    const button = document.createElement("button");
    button.className = "btn btn-primary";
    if (forMobile) {
      button.classList.add("form-switch")
    }

    const svg = printess.getIcon(p.imageMeta?.invert !== 0 ? "image-solid" : "image-regular");
    svg.style.width = "32px";
    svg.style.height = "32px";
    svg.style.cursor = "pointer";
    svg.style.margin = "5px";

    button.onclick = () => {
      const newValue = p.imageMeta?.invert === 0 ? 100 : 0;
      printess.setNumberUiProperty(p, "image-invert", newValue);
      if (metaProperty && p.imageMeta) {
        p.imageMeta["invert"] = newValue; // update our model
      }
      const svg = printess.getIcon(p.imageMeta?.invert !== 0 ? "image-solid" : "image-regular");
      svg.style.width = "42px";
      svg.style.height = "42px";
      svg.style.cursor = "pointer";
      button.innerHTML = "";
      button.appendChild(svg);
    }

    button.appendChild(svg);

    return button;

  }

  function getInvertImageCheckerMobile(printess: iPrintessApi, p: iExternalProperty, metaProperty: "image-invert", forMobile: boolean = false): HTMLElement {
    const container = document.createElement("div");
    container.className = "form-check mt-3";
    if (forMobile) {
      container.classList.add("form-switch")
    }

    const id = "invert-image-checker";

    const input = document.createElement("input");
    input.className = "form-check-input";
    input.id = id;
    input.type = "checkbox";
    input.checked = printess.getNumberUi(p, metaProperty)?.value === 0 ? false : true;

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", id);
    if (forMobile) label.style.color = input.checked ? "var(--bs-light)" : "var(--bs-primary)";
    label.textContent = input.checked && forMobile ? printess.gl("ui.revertImage") : printess.gl("ui.invertImage");

    input.onchange = () => {
      const newValue = input.checked ? 100 : 0;
      printess.setNumberUiProperty(p, "image-invert", newValue);

      if (metaProperty && p.imageMeta) {
        p.imageMeta["invert"] = newValue; // update our model
      }

      if (forMobile) label.style.color = input.checked ? "var(--bs-light)" : "var(--bs-primary)";
      label.textContent = input.checked && forMobile ? printess.gl("ui.revertImage") : printess.gl("ui.invertImage");
    }

    container.appendChild(input);
    container.appendChild(label);
    return container;
  }

  function getNumberSlider(printess: iPrintessApi, p: iExternalProperty, metaProperty: "image-hueRotate" | "image-brightness" | "image-contrast" | "image-vivid" | "image-sepia" | null = null, forMobile: boolean = false): HTMLElement {
    // creaate slider for all "Number" properties
    const ui = printess.getNumberUi(p, metaProperty);
    if (!ui) {
      const er = document.createElement("div");
      er.textContent = printess.gl("ui.numberSlider", p.id, (metaProperty || ""));
      return er;
    }

    const rangeLabel = document.createElement("label");
    const range: HTMLInputElement = document.createElement("input");
    range.className = "form-range";
    range.id = metaProperty ?? "";
    range.style.marginLeft = "0px";
    range.type = "range";
    range.min = ui.meta.min.toString();
    range.max = ui.meta.max.toString();
    range.step = ui.meta.step.toString();
    range.value = ui.value.toString();

    if (printess.isIPhone()) {
      range.classList.add("slider-catch-radius");
    }

    range.oninput = () => {

      const newValue = parseFloat(range.value);
      printess.setNumberUiProperty(p, metaProperty, newValue);

      if (metaProperty && p.imageMeta) {
        const imProp = <"hueRotate" | "brightness" | "contrast" | "vivid" | "sepia">metaProperty.replace("image-", "");
        p.imageMeta[imProp] = newValue; // update our model
      } else if (!metaProperty) {
        p.value = newValue; // update our model
      }
      // update mobile circle if present
      const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }
    }
    const span = document.createElement("span");
    span.textContent = metaProperty ? printess.gl('ui.' + metaProperty) : printess.gl(p.label);
    rangeLabel.appendChild(span);
    rangeLabel.appendChild(range);
    if (forMobile) {
      rangeLabel.classList.add("form-control")
    }
    return rangeLabel;
  }


  function getFontSizeDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement, fullWidth: boolean = true): HTMLElement {

    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.classList.add("btn-group");
      dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";

    const sizes = printess.getFontSizesInPt().map(f => f + "pt");
    // ["6pt", "7pt", "8pt", "9pt", "10pt", "11pt", "12pt", "13pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
    const ddContent = document.createElement("ul");
    if (p.textStyle && sizes.length) {
      const selectedItem = sizes.filter(itm => itm === p.textStyle?.size ?? "??pt")[0] ?? null;
      const button = document.createElement("button");
      button.className = "btn btn-light dropdown-toggle";
      if (fullWidth) {
        button.classList.add("full-width");
      }
      //  button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");
      if (selectedItem) {
        button.innerText = selectedItem;
      } else {
        button.innerText = p.textStyle ? Number(p.textStyle.size.slice(0, -2)).toFixed(2) + "pt" : "??pt";
      }
      dropdown.appendChild(button);

      if (asList) {
        ddContent.classList.add("list-group");
        ddContent.classList.add("list-group-grid-style");
      } else {
        ddContent.classList.add("dropdown-menu");
        ddContent.setAttribute("aria-labelledby", "defaultDropdown");
        ddContent.style.width = "100%";
        ddContent.style.maxHeight = "400px";
      }

      ddContent.style.overflow = "hidden auto";

      for (const entry of sizes) {
        const li = document.createElement("li");
        if (asList) {
          li.classList.add("list-group-item");
          if (entry === selectedItem) {
            li.classList.add("active");
          }
        }
        //const a = document.createElement("a");
        li.classList.add("dropdown-item");
        li.onclick = () => {
          button.innerHTML = "";
          printess.setTextStyleProperty(p.id, "size", entry);
          if (p.textStyle) p.textStyle.size = entry;
          button.innerText = entry;
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active")
            // update button 
            const mobileButtonDiv = document.getElementById(p.id + ":text-style-size");
            if (mobileButtonDiv) {
              drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
            }
          }

        }

        li.innerText = entry;
        //   li.appendChild(a);
        ddContent.appendChild(li)
      }
      dropdown.appendChild(ddContent);
    }
    if (asList) {
      return ddContent;
    } else {
      return dropdown
    }


  }

  function getFontDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement, fullWidth: boolean = true): HTMLElement {

    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.classList.add("btn-group");
      dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";

    const fonts = printess.getFonts(p.id);
    const ddContent = document.createElement("ul");

    let selectedItem: { name: string, thumbUrl: string, displayName: string, familyName: string, weight: number, isItalic: boolean } | null = null;
    if (fonts.length) {
      if (p.textStyle) {
        selectedItem = fonts.filter(itm => itm.name === p.textStyle?.font ?? "")[0] ?? null;
      } else {
        selectedItem = fonts.filter(itm => itm.name === p.value.toString())[0] ?? null;
      }
      const button = document.createElement("button");
      button.className = "btn btn-light dropdown-toggle";
      if (fullWidth) {
        button.classList.add("full-width");
      }
      // button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");
      if (selectedItem) {
        button.appendChild(getDropdownImageContent(selectedItem.thumbUrl));
      } else {
        const txt = document.createElement("div");
        txt.style.textAlign = "left";
        txt.textContent = printess.gl("ui.fontSelectText");
        button.appendChild(txt);
      }
      dropdown.appendChild(button);

      if (asList) {
        ddContent.classList.add("list-group");
      } else {
        ddContent.classList.add("dropdown-menu");
        ddContent.setAttribute("aria-labelledby", "defaultDropdown");
        ddContent.style.width = "100%";
        ddContent.style.maxHeight = "400px";
      }


      ddContent.style.overflow = "hidden auto";

      for (const entry of fonts) {
        const li = document.createElement("li");

        li.classList.add("dropdown-item");

        if (asList) {
          li.classList.add("list-group-item");
          li.classList.add("font");
          if (entry === selectedItem) {
            li.classList.add("active");
          }
        }

        li.onclick = () => {

          if (p.textStyle) {
            printess.setTextStyleProperty(p.id, "font", entry.name);
            p.textStyle.font = entry.name;
          } else {
            printess.setProperty(p.id, entry.name);
            p.value = entry.name;
          }
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active");
            // update button 
            const mobileButtonDiv = document.getElementById(p.id + ":text-style-font");
            if (mobileButtonDiv) {
              drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup)
            }
          } else {
            button.innerHTML = "";
            button.appendChild(getDropdownImageContent(entry.thumbUrl));
          }


        }
        li.appendChild(getDropdownImageContent(entry.thumbUrl));

        ddContent.appendChild(li)
      }
      dropdown.appendChild(ddContent);
    }
    if (asList) {
      return ddContent;
    } else {
      return dropdown
    }


  }
  function getParagraphStyleDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement, fullWidth: boolean = true): HTMLElement {

    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.classList.add("btn-group");
      dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";

    const styles = ["[none]", ...printess.getParagraphStyles(p.id).map(x => x.class)];
    const ddContent = document.createElement("ul");

    const selectedItem = p.textStyle?.pStyle || "[none]";
    if (styles.length) {

      const button = document.createElement("button");
      button.className = "btn btn-light dropdown-toggle";
      if (fullWidth) {
        button.classList.add("full-width");
      }
      // button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");
      if (selectedItem) {
        button.appendChild(getDropdownTextContent(selectedItem));
      }
      dropdown.appendChild(button);

      if (asList) {
        ddContent.classList.add("list-group");
      } else {
        ddContent.classList.add("dropdown-menu");
        ddContent.setAttribute("aria-labelledby", "defaultDropdown");
        ddContent.style.width = "100%";
        ddContent.style.maxHeight = "400px";
      }


      ddContent.style.overflow = "hidden auto";

      for (const entry of styles) {
        const li = document.createElement("li");

        li.classList.add("dropdown-item");

        if (asList) {
          li.classList.add("list-group-item");
          li.classList.add("font");
          if (entry === selectedItem) {
            li.classList.add("active");
          }
        }

        li.onclick = () => {

          if (p.textStyle) {
            printess.setTextStyleProperty(p.id, "pStyle", entry);
            p.textStyle.pStyle = entry;
          } else {
            printess.setProperty(p.id, entry);
            p.value = entry;
          }
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active");
            // update button 
            const mobileButtonDiv = document.getElementById(p.id + ":text-style-paragraph-style");
            if (mobileButtonDiv) {
              drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup)
            }
          } else {
            button.innerHTML = "";
            button.appendChild(getDropdownTextContent(entry));
          }


        }
        li.appendChild(getDropdownTextContent(entry));

        ddContent.appendChild(li)
      }
      dropdown.appendChild(ddContent);
    }
    if (asList) {
      const cont = document.createElement("p");
      const txt = document.createElement("label");
      txt.classList.add("mb-1");
      txt.innerText = "Paragraph Style:"
      cont.appendChild(txt);
      cont.appendChild(ddContent);

      return cont;
    } else {
      return dropdown
    }


  }

  function getDropdownImageContent(thumbUrl: string): HTMLDivElement {
    const img = document.createElement("img");
    img.src = thumbUrl;
    img.style.height = "20px";
    /* const div = document.createElement("div");
     div.style.width = "100%";
     div.style.display = "flex";
     div.appendChild(img);*/
    return img;
  }
  function getDropdownTextContent(text: string): HTMLSpanElement {
    const txt = document.createElement("span");
    txt.innerText = text;
    return txt;
  }


  function getVAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

    const group = document.createElement("div");
    group.className = "btn-group";
    group.classList.add("align-control-item");

    if (!forMobile) {
      group.style.marginLeft = "0px";
    }

    if (forMobile) {
      group.classList.add("form-control");
      // group.style.left = "50%";
      // group.style.transform = "translateX(-50%)";
    }

    for (const v of ["top", "center", "bottom"]) {
      let icon: iconName = "text-top";
      switch (v) {
        case "center": icon = "text-center"; break;
        case "bottom": icon = "text-bottom"; break;
      }

      const id = p.id + "btnVAlignRadio" + v;

      group.appendChild(getRadioButton(printess, p, id, "vAlign", v));
      group.appendChild(getRadioLabel(printess, p, id, "vAlign", icon));
    }

    return group;
  }

  function getHAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

    const group = document.createElement("div");
    group.className = "btn-group";
    group.classList.add("align-control-item");

    if (!forMobile) {
      group.style.marginLeft = "0px";
    }

    if (forMobile) {
      group.classList.add("form-control");
      // group.style.left = "50%";
      // group.style.transform = "translateX(-50%)";
    }
    for (const v of ["left", "center", "right", "justifyLeft"]) { // you can add missing options if needed:  "justifyCenter", "justifyRight", "justifyJustify" 
      let icon: iconName = "text-align-left";
      switch (v) {
        case "right": icon = "text-align-right"; break;
        case "center": icon = "text-align-center"; break;
        case "justifyLeft": icon = "text-align-justify-left"; break;
        case "justifyCenter": icon = "text-align-justify-center"; break;
        case "justifyRight": icon = "text-align-justify-right"; break;
        case "justifyJustify": icon = "text-align-justify-justify"; break;
      }

      //  <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
      //  <label class="btn btn-outline-primary" for="btnradio1">Radio 1</label>

      const id = p.id + "btnHAlignRadio" + v;

      group.appendChild(getRadioButton(printess, p, id, "hAlign", v));
      group.appendChild(getRadioLabel(printess, p, id, "hAlign", icon));

    }

    return group;
  }

  function getVAlignAndHAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {
    const container = document.createElement("div");
    container.className = "align-control-container";

    container.appendChild(getHAlignControl(printess, p, forMobile));
    container.appendChild(getVAlignControl(printess, p, forMobile));
    return container;
  }

  function getRadioLabel(printess: iPrintessApi, p: iExternalProperty, id: string, name: string, icon: iconName): HTMLLabelElement {
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.className = "btn btn-outline-dark";
    label.style.width = "46px";
    label.style.flex = "0 0 auto";
    const svg = printess.getIcon(icon);
    svg.style.width = "20px";
    svg.style.height = "20px";
    svg.style.pointerEvents = "none";
    label.appendChild(svg);
    return label;
  }

  function getRadioButton(printess: iPrintessApi, p: iExternalProperty, id: string, name: "hAlign" | "vAlign", value: string): HTMLInputElement {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.className = "btn-check";
    radio.dataset.value = value;
    radio.name = name + "_" + p.id;
    radio.id = id;
    if (p.textStyle && p.textStyle[name] === value) {
      radio.checked = true;
    }
    radio.onclick = () => {
      printess.setTextStyleProperty(p.id, name, value);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (p.textStyle) p.textStyle[name] = value;

      // update mobile button if exists:
      let mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-" + name);
      if (!mobileButtonDiv && name === "hAlign") {
        mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-vAlign-hAlign");
      }
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p], p.controlGroup);
      }

    }
    return radio;
  }





  /*
   * PAGE LIST 
   */


  function getPaginationItem(printess: iPrintessApi, content: number | "previous" | "next" | "ellipsis", spread?: iExternalSpreadInfo, page?: "left-page" | "right-page", isActive?: boolean, bigSpaceBetween: boolean = false, disabled: boolean = false): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "page-item";

    if (disabled) {
      li.style.opacity = "0.5";
      li.classList.add("disabled");
    }
    const a = document.createElement("div");
    a.className = "page-link";

    if (isActive) {
      li.classList.add("active");
    }

    let pageIndex = 0;
    if (page === "right-page") {
      pageIndex = 1;
    }
    if (typeof content === "number" && spread) {
      a.innerText = spread.names[pageIndex] ? spread.names[pageIndex] : content.toString();

    } else if (content === "previous") {
      const svg = printess.getIcon("carret-left-solid");
      svg.style.height = "1.3em";
      a.appendChild(svg);
      // a.innerHTML = "&laquo";
    } else if (content === "next") {
      const svg = printess.getIcon("carret-right-solid");
      svg.style.height = "1.3em";
      a.appendChild(svg);
      // a.innerHTML = "&raquo";
    } else if (content === "ellipsis") {
      a.innerHTML = "&#8230";
      a.className = "page-ellipsis disabled";
      li.style.opacity = "0.4";
    }
    li.appendChild(a);

    if (
      content === "ellipsis" || content === "previous" ||
      (spread &&
        ((page === "left-page" && spread.pages === 1) || (page === "right-page" && spread.pages === 2))
      )
    ) {
      if (bigSpaceBetween) {
        li.classList.add("me-3");
      } else {
        li.classList.add("me-2");
      }
    }
    li.onclick = () => {
      uih_currentVisiblePage = null;
      if (content === "previous") {
        printess.previousPage();
      } else if (content === "next") {
        printess.nextPage();
      } else if (spread) {
        printess.selectSpread(spread.index, page);
        document.querySelectorAll(".page-item").forEach(pi => pi.classList.remove("active"));
        li.classList.add("active");
      }

    }

    return li;
  }

  function updatePageThumbnail(spreadId: string, pageId: string, url: string): void {
    const thumb = document.getElementById("thumb_" + spreadId + "_" + pageId);
    if (thumb) {
      (<HTMLDivElement>thumb).style.backgroundImage = 'url("' + url + '")';
    }
  }

  function refreshUndoRedoState(printess: iPrintessApi) {
    const btnUndo = <HTMLButtonElement>document.querySelector(".undo-button");
    if (btnUndo) {
      if (printess.undoCount() === 0) {
        btnUndo.disabled = true;
      } else {
        btnUndo.disabled = false;
      }
    }
    const btnRedo = <HTMLButtonElement>document.querySelector(".redo-button");
    if (btnRedo) {
      if (printess.redoCount() === 0) {
        btnRedo.disabled = true;
      } else {
        btnRedo.disabled = false;
      }
    }
  }

  // open dialog to confirm closing of editor
  function getCloseEditorDialog(printess: iPrintessApi): void {
    if (printess.showAlertOnClose() === false) {
      const callback = printess.getBackButtonCallback();
      if (callback) {
        handleBackButtonCallback(printess, callback);
      }
      return;
    }
    const content = document.createElement("div");
    content.className = "d-flex flex-column align-items-center";
    const id = "CLOSEEDITORMODAL";

    const txtOne = document.createElement("p");
    txtOne.style.fontWeight = "bold";
    txtOne.innerHTML = printess.gl('ui.closeEditorTextTwo');
    const txtTwo = document.createElement("p");
    txtTwo.textContent = printess.gl("ui.closeEditorTextOne");

    content.appendChild(txtOne);
    content.appendChild(txtTwo);

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const close = document.createElement("button");
    close.className = "btn btn-outline-primary";
    close.textContent = printess.gl("ui.buttonNo");
    close.onclick = () => {
      hideModal(id);
    }

    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = printess.gl("ui.buttonYes");
    ok.onclick = async () => {
      hideModal(id);
      const callback = printess.getBackButtonCallback();
      if (callback) {
        handleBackButtonCallback(printess, callback);
      } else {
        // button was disabled, so this is never reached 
        alert(printess.gl("ui.backButtonCallback"));
      }
    }

    footer.appendChild(close);
    footer.appendChild(ok);

    showModal(printess, id, content, printess.gl("ui.closeEditorTitle", printess.getTemplateTitle()), footer);
  }

  function getBackUndoMiniBar(printess: iPrintessApi): HTMLDivElement {
    const miniBar: HTMLDivElement = document.createElement("div");
    const btnBack = document.createElement("button");

    const cornerTools = printess.pageNavigationDisplay() === "icons";

    const caption = printess.gl("ui.buttonBack");
    btnBack.className = "btn btn-outline-secondary";
    if (cornerTools) {
      btnBack.classList.add("btn-sm");
    } else {
      btnBack.classList.add("me-2");
      btnBack.innerText = caption;
      btnBack.style.marginRight = "5px";
    }

    const closeIcon = <iconName>printess.gl("ui.buttonBackIcon") || "close";
    const icon = cornerTools ? closeIcon : <iconName>printess.gl("ui.buttonBackIcon");
    if (icon) {
      const svg = printess.getIcon(icon);
      svg.style.fill = "var(--bs-secondary)";

      if (!cornerTools) {
        svg.style.height = "24px";
        svg.style.float = "left";
        svg.style.marginRight = caption ? "10px" : "0px";
      }
      btnBack.appendChild(svg);
    }

    if (!printess.getBackButtonCallback()) {
      btnBack.classList.add("disabled");
    }
    btnBack.onclick = () => {
      if (printess.isInDesignerMode()) {
        const callback = printess.getBackButtonCallback();
        if (callback) {
          handleBackButtonCallback(printess, callback);
        } else {
          // button was disabled, so this is never reached 
          alert(printess.gl("ui.backButtonCallback"));
        }
      } else {
        getCloseEditorDialog(printess);
      }
    }
    if (printess.hasPreviewBackButton() && !cornerTools) {
      const previewBackButton = getPreviewBackButton(printess);
      previewBackButton.classList.add("me-2");
      miniBar.appendChild(previewBackButton);
    } else if (!cornerTools) {
      miniBar.appendChild(btnBack);
    }

    if (printess.showUndoRedo() || cornerTools) {
      const btnUndo = document.createElement("button");
      btnUndo.className = "btn btn-sm btn-outline-secondary undo-button";
      if (printess.undoCount() === 0) {
        btnUndo.disabled = true;
      }
      const icoUndo = printess.getIcon("undo-arrow");
      icoUndo.classList.add("icon");
      btnUndo.onclick = () => {
        printess.undo();
      }
      btnUndo.appendChild(icoUndo);
      miniBar.appendChild(btnUndo);

      const btnRedo = document.createElement("button");
      btnRedo.className = "btn btn-sm btn-outline-secondary me-2 redo-button";
      const iconRedo = printess.getIcon("redo-arrow");
      iconRedo.classList.add("icon");
      if (printess.redoCount() === 0) {
        btnRedo.disabled = true;
      }
      btnRedo.onclick = () => {
        printess.redo();
      }
      btnRedo.appendChild(iconRedo);
      miniBar.appendChild(btnRedo);
    }

    if (printess.allowZoomOptions()) {
      miniBar.classList.add("allow-zoom-and-pan");
      const btnZoomIn = document.createElement("button");
      btnZoomIn.className = "btn btn-sm btn-outline-secondary me-1";
      const iconZoomIn = printess.getIcon("plus");
      iconZoomIn.classList.add("icon");
      btnZoomIn.appendChild(iconZoomIn);
      btnZoomIn.onclick = () => printess.zoomIn();
      if (!cornerTools) miniBar.appendChild(btnZoomIn);

      const dropdownItems = getItemsForZoomDropdown(printess);
      miniBar.appendChild(getZoomOptionsMenu(printess, "", dropdownItems, false, "search-light"));

      const btnZoomOut = document.createElement("button");
      btnZoomOut.className = "btn btn-sm btn-outline-secondary me-2";
      const iconZoomOut = printess.getIcon("minus-light");
      iconZoomOut.classList.add("icon");
      btnZoomOut.appendChild(iconZoomOut);
      btnZoomOut.onclick = () => printess.zoomOut();
      if (!cornerTools) miniBar.appendChild(btnZoomOut);
    }

    if (printess.hasExpertButton()) {
      miniBar.appendChild(getExpertModeButton(printess, false));
    }
    if (printess.showSaveButton()) {
      miniBar.appendChild(getSaveButton(printess, false));
    }

    miniBar.classList.add("undo-redo-bar");

    if (cornerTools) {
      miniBar.appendChild(document.createElement("div")); // space between
      miniBar.appendChild(btnBack);
    }

    return miniBar;
  }

  function getZoomOptionsMenu(printess: iPrintessApi, title: string, dropdownItems: iDropdownItems[], showDropdownTriangle: boolean = true, icon?: iconName): HTMLElement {
    const cornerTools = printess.pageNavigationDisplay() === "icons";
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown d-flex me-1";
    const dropdownBtn = document.createElement("button");
    dropdownBtn.className = "btn btn-outline-secondary dropdown-toggle";
    dropdownBtn.id = "dropdownMenuButton";
    dropdownBtn.textContent = title;
    dropdownBtn.setAttribute("data-bs-toggle", "dropdown");
    if (cornerTools) {
      dropdownBtn.classList.add("btn-sm");
    }

    if (!showDropdownTriangle) {
      dropdownBtn.classList.add("no-after");
    }

    if (icon) {
      const svg = printess.getIcon(icon);
      svg.classList.add("icon");
      dropdownBtn.appendChild(svg);
    }

    dropdown.appendChild(dropdownBtn);

    const ul = document.createElement("ul");
    ul.className = "dropdown-menu";
    ul.setAttribute("aria-labelledby", "dropdownMenuButton");

    dropdownItems.forEach(di => {
      if (di.show) {
        const li = document.createElement("li");
        const btn = document.createElement("a");
        btn.className = "dropdown-item";
        if (di.disabled) btn.classList.add("disabled");
        btn.textContent = printess.gl(di.caption);
        btn.onclick = () => di.task();
        li.appendChild(btn);
        ul.appendChild(li);
      }
    });

    dropdown.appendChild(ul);
    return dropdown;
  }

  function getItemsForZoomDropdown(printess: iPrintessApi): iDropdownItems[] {
    const spreadId = printess.pageInfoSync().spreadId;
    const currentSpreadIndex = printess.getAllSpreads().findIndex(s => s.spreadId === spreadId);

    const zoomItems: iDropdownItems[] = [{
      caption: "ui.zoomIn",
      show: true,
      task: printess.zoomIn
    }, {
      caption: "ui.zoomOut",
      show: true,
      task: printess.zoomOut
    }, {
      caption: "ui.zoomLeftPage",
      show: printess.isDoublePageSpread() && uih_currentVisiblePage !== "left-page",
      task: () => {
        printess.selectSpread(currentSpreadIndex, "left-page");
        uih_currentVisiblePage = "left-page"
      }
    }, {
      caption: "ui.zoomRightPage",
      show: printess.isDoublePageSpread() && uih_currentVisiblePage !== "right-page",
      task: () => {
        printess.selectSpread(currentSpreadIndex, "right-page");
        uih_currentVisiblePage = "right-page"
      }
    }, {
      caption: "ui.zoomFullPage",
      show: printess.isDoublePageSpread() && uih_currentVisiblePage !== "entire" || !printess.isDoublePageSpread(),
      task: () => {
        printess.selectSpread(currentSpreadIndex, "entire");
        uih_currentVisiblePage = "entire"
      }
    }/* , {
      caption: "ui.zoomToFrame",
      disabled: !printess.hasSelection(),
      show: true,
      task: () => {
        printess.setZoomMode("frame");
        printess.resizePrintess(true, true);
      }
    } */];

    return zoomItems;
  }

  // Get the add pages and arrange pages buttons for books to add them right after the page icons
  function getPageArrangementButtons(printess: iPrintessApi, addSpreads: number, removeSpreads: number, forMobile: boolean): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "big-page-item mr";
    if (forMobile) {
      li.classList.add("mobile");
    } else {
      li.appendChild(document.createElement("div"));
    }

    const pageButtons = document.createElement("div");
    pageButtons.className = "modify-page-buttons";

    if (addSpreads > 0) {
      const btnAdd = document.createElement("div");
      btnAdd.className = "btn btn-sm btn-outline-secondary w-100";
      btnAdd.innerText = "+" + (addSpreads * 2) + " " + printess.gl("ui.pages");
      btnAdd.onclick = () => {
        printess.addSpreads();
      }
      pageButtons.appendChild(btnAdd);
    }
    if (addSpreads || removeSpreads) {
      const arrangePagesBtn = document.createElement("button");
      arrangePagesBtn.className = "btn btn-sm btn-outline-secondary w-100";
      arrangePagesBtn.innerText = "Arrange Pages";
      arrangePagesBtn.onclick = () => getArrangePagesOverlay(printess, forMobile);
      pageButtons.appendChild(arrangePagesBtn);
    }

    /* if (removeSpreads > 0) {
      const btnRemove = document.createElement("div");
      btnRemove.className = "btn btn-sm btn-secondary";
      btnRemove.innerText = "-" + (addSpreads * 2) + " " + printess.gl("ui.pages");
      btnRemove.onclick = () => {
        printess.removeSpreads();
        printess.resizePrintess();
      }
      pageButtons.appendChild(btnRemove);
    }*/

    li.appendChild(pageButtons);


    return li
  }

  function renderPageNavigation(printess: iPrintessApi, container?: HTMLDivElement, large: boolean = false, forMobile: boolean = false): void {

    const spreads = printess.getAllSpreads();
    const info = printess.pageInfoSync();
    let lastScrollLeftPos: number = 0;

    // draw pages ui
    const pages: HTMLDivElement | null = container || document.querySelector("#desktop-pagebar");
    if (pages) {


      const scrollContainer = pages.querySelector(".pagination");
      if (scrollContainer && printess.pageNavigationDisplay() === "icons") {
        lastScrollLeftPos = scrollContainer.scrollLeft;
      }
      pages.innerHTML = "";

      if (!forMobile && printess.pageNavigationDisplay() !== "icons") {
        /* Add back/undo/redo mini desktop toolbar  */
        pages.appendChild(getBackUndoMiniBar(printess));
      }

      const ul = document.createElement("ul");
      ul.className = "pagination";
      if (large) {
        ul.classList.add("pagination-lg");
      }

      pages.classList.remove("tabs");
      pages.classList.remove("big");

      const isDocTabs = printess.pageNavigationDisplay() === "doc-tabs";
      const isStepTabsList = printess.stepHeaderDisplay() === "tabs list";
      const isStepBadgeList = printess.stepHeaderDisplay() === "badge list";

      if (printess.pageNavigationDisplay() === "icons") {
        pages.classList.add("big");
        ul.style.overflowX = "auto";
        document.documentElement.style.setProperty("--editor-pagebar-height", "122px");
        document.documentElement.style.setProperty("--editor-margin-top", "10px"); // 20px

      } else if (isStepTabsList || isDocTabs) {
        pages.classList.add("tabs");
        ul.style.overflowX = "auto";
        document.documentElement.style.setProperty("--editor-pagebar-height", "50px");

      } else {
        ul.classList.add("justify-content-center");
        document.documentElement.style.setProperty("--editor-pagebar-height", "50px");
      }

      if (isStepTabsList || isStepBadgeList || isDocTabs) {

        const tabsContainer = document.createElement("div");
        tabsContainer.className = "step-tabs-list";
        tabsContainer.id = "step-tab-list";
        tabsContainer.style.margin = "0 10px";

        if (!forMobile && !isDocTabs && isStepBadgeList) {
          const prevTab = document.createElement("div");
          prevTab.className = "nav-item";
          const prevTabLink = document.createElement("a");
          prevTabLink.className = "prev-badge btn btn-primary";
          const icon = printess.getIcon("carret-left-solid");
          icon.classList.add("tabs-scroller");
          icon.style.paddingRight = "2px";
          prevTabLink.appendChild(icon);
          prevTab.appendChild(prevTabLink);
          tabsContainer.appendChild(prevTab);

          prevTab.onclick = () => {
            const tabListScrollbar = <HTMLDivElement>document.getElementById("tabs-list-scrollbar");
            if (tabListScrollbar && tabListScrollbar.scrollWidth > tabListScrollbar.clientWidth) {
              scrollToLeft(tabListScrollbar, tabListScrollbar.scrollLeft - 200, 300, tabListScrollbar.scrollLeft);
            } else if (tabListScrollbar.scrollWidth === tabListScrollbar.clientWidth && printess.hasPreviousStep()) {
              printess.previousStep();
            } else {
              prevTabLink.classList.add("disabled");
            }
          }
        }

        tabsContainer.appendChild(getStepsTabsList(printess, forMobile, isDocTabs ? "doc tabs" : <"badge list" | "tabs list">printess.stepHeaderDisplay()));

        if (!forMobile && !isDocTabs && !isStepTabsList) {
          const nextTab = document.createElement("div");
          nextTab.className = "nav-item";
          nextTab.style.zIndex = "10";
          nextTab.style.marginLeft = "-1px";
          const nextTabLink = document.createElement("a");
          nextTabLink.className = "next-badge btn btn-primary";
          const icon = printess.getIcon("carret-right-solid");
          icon.classList.add("tabs-scroller");
          icon.style.paddingLeft = "2px";
          nextTabLink.appendChild(icon);
          nextTab.appendChild(nextTabLink);
          tabsContainer.appendChild(nextTab);

          nextTab.onclick = () => {
            const tabListScrollbar = <HTMLDivElement>document.getElementById("tabs-list-scrollbar");
            if (tabListScrollbar && tabListScrollbar.scrollWidth > tabListScrollbar.clientWidth) {
              scrollToLeft(tabListScrollbar, tabListScrollbar.scrollLeft + 200, 300, tabListScrollbar.scrollLeft);
            } else if (tabListScrollbar.scrollWidth === tabListScrollbar.clientWidth && printess.hasNextStep()) {
              printess.nextStep();
            } else {
              nextTabLink.classList.add("disabled");
            }
          }
        }

        pages.appendChild(tabsContainer);

        // container for price preview and basket button
        const wrapper = document.createElement("div");
        wrapper.className = "d-flex price-basket-wrapper";

        const priceDiv = document.createElement("div");
        priceDiv.className = "total-price-container";
        priceDiv.id = "total-price-display";
        if (uih_currentPriceDisplay) {
          getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
        } else if (printess.getProductInfoUrl()) {
          const infoIcon = printess.getIcon("info-circle");
          infoIcon.classList.add("product-info-icon");
          infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), printess.getProductInfoUrl(), forMobile);
          priceDiv.appendChild(infoIcon);
        }


        wrapper.appendChild(priceDiv);

        // Preview Button for Doc Tabs Navigation
        const basketBtnBehaviour = printess.getBasketButtonBehaviour();
        if (basketBtnBehaviour === "go-to-preview" && isDocTabs) {
          const previewBtn = document.createElement("button");
          previewBtn.className = "btn btn-outline-primary";
          previewBtn.classList.add("ms-2");
          previewBtn.innerText = printess.gl("ui.buttonPreview");
          previewBtn.onclick = async () => {
            const validation = await validateAllInputs(printess, "preview");
            if (validation) {
              await printess.gotoNextPreviewDocument(0);
              if (printess.showTabNavigation()) {
                printess.resizePrintess();
              }
            }
          }
          wrapper.appendChild(previewBtn);
        } else if (printess.hasPreviewBackButton() && isDocTabs) {
          tabsContainer.style.visibility = "hidden";
          const previewBackButton = getPreviewBackButton(printess);
          wrapper.appendChild(previewBackButton);
        }

        // Save & Quit Button
        if (printess.showSaveAndCloseButton()) {
          const saveAndQuitButton = document.createElement("button");
          saveAndQuitButton.className = "btn btn-primary ms-2";
          saveAndQuitButton.textContent = printess.gl("ui.buttonSaveAndClose");

          saveAndQuitButton.onclick = () => saveTemplate(printess, "close");
          wrapper.appendChild(saveAndQuitButton);
        }

        // Mini-Cart Button
        const button = document.createElement("button");
        button.className = "btn btn-primary ms-2";
        const iconName = <iconName>printess.gl("ui.buttonBasketIcon") || "shopping-cart-add";
        const icon = printess.getIcon(iconName);
        icon.style.width = "25px";
        icon.style.height = "25px";
        icon.style.fill = "var(--bs-light)";

        button.onclick = () => addToBasket(printess);
        button.appendChild(icon);

        if (!printess.showAddToBasketButton()) {
          wrapper.appendChild(document.createElement("div"));
        } else {
          wrapper.appendChild(button);
        }

        if (isStepTabsList || isDocTabs) pages.appendChild(wrapper);

        return;
      }

      if (printess.pageNavigationDisplay() === "icons") {
        // **** BIG PAGE BAR !!! ****
        // render documents and pages 
        // always also for single page documents

        const docs = printess.getAllDocsAndSpreads();

        const pagesContainer = document.createElement("ul");
        pagesContainer.className = "pages-container";
        for (const doc of docs) {
          const count = doc.spreads.reduce((prev, cur) => prev + cur.pages, 0);
          let pageNo = 0;
          for (const spread of doc.spreads) {
            for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
              pageNo++;
              const page = pageIndex === 0 ? "left-page" : "right-page";
              const isActive = info.spreadId === spread.spreadId && info.current === pageNo;
              if (isActive && !uih_currentVisiblePage) uih_currentVisiblePage = page;

              const disabled = printess.lockCoverInside() && (pageNo === 2 || pageNo === count - 1);

              const li = document.createElement("li");
              li.className = "big-page-item" + (forMobile ? " mobile" : "");

              if (disabled) {
                li.style.opacity = "0.5";
                li.classList.add("disabled");
              }
              if (pageIndex === 0) {
                if (doc.spreads[doc.spreadCount - 1] === spread) {
                  if (forMobile) {
                    li.classList.add("mobile-mr");
                  } else {
                    li.classList.add("mr");
                  }
                }
                li.classList.add("ml");
              }

              if (isActive) li.classList.add("active");

              const p = spread.thumbnails ? spread.thumbnails[page === "right-page" ? 1 : 0] ?? null : null;
              const url = p?.url ?? "";
              const thumb = document.createElement("div");
              thumb.className = "big-page-thumb";
              thumb.id = "thumb_" + spread.spreadId + "_" + (p?.pageId ?? "")
              if (url) {
                thumb.style.backgroundImage = "url(" + url + ")";
                thumb.style.backgroundColor = p?.bgColor ?? "white"
              }
              if (spread.pages > 1) {
                const shadow = document.createElement("div");
                if (pageIndex === 0) {
                  shadow.classList.add("book-shadow-gradient-left");
                  thumb.style.borderRight = "none";
                } else {
                  shadow.classList.add("book-shadow-gradient-right");
                  thumb.style.borderLeft = "none";
                }
                thumb.appendChild(shadow);
              }

              thumb.style.width = (spread.width / spread.pages / spread.height * 72) + "px";
              thumb.style.backgroundSize = "cover";

              const caption = document.createElement("div");
              caption.className = "big-page-caption";

              caption.innerText = spread.names[pageIndex] ? spread.names[pageIndex] : pageNo.toString(); //printess.gl("ui.page") + " " + pageNo.toString();

              if (forMobile) {
                li.appendChild(thumb);
                li.appendChild(caption);
              } else {
                li.appendChild(caption);
                li.appendChild(thumb);
              }

              li.onclick = () => {
                uih_currentVisiblePage = null;
                printess.selectDocumentAndSpread(doc.docId, spread.index, page);
                document.querySelectorAll(".big-page-item").forEach(pi => pi.classList.remove("active"));
                li.classList.add("active");
              }
              pagesContainer.appendChild(li);


            }
          }

        }

        // attach add pages and arrange pages buttons to the list
        const addSpreads = printess.canAddSpreads();
        const removeSpreads = printess.canRemoveSpreads();
        if (addSpreads > 0 || removeSpreads > 0) {
          pagesContainer.appendChild(getPageArrangementButtons(printess, addSpreads, removeSpreads, forMobile));
        }

        ul.appendChild(pagesContainer);



      } else if (spreads.length > 1 && printess.pageNavigationDisplay() === "numbers") {


        const prev = getPaginationItem(printess, "previous");
        if (info.isFirst) {
          prev.classList.add("disabled");
        }
        ul.appendChild(prev);


        const count = spreads.reduce((prev, cur) => prev + cur.pages, 0);
        // const hasFacingPages = spreads.reduce((prev, cur) => prev || (cur.pages > 1 ? 1 : 0), 0);
        const current = info.current;
        let pageNo = 0;
        let lastPos: "start" | "current" | "end" | "skip" = "start";
        for (const spread of spreads) {

          for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
            pageNo++;
            const page = pageIndex === 0 ? "left-page" : "right-page";
            const isActive = current === pageNo;
            if (isActive && !uih_currentVisiblePage) uih_currentVisiblePage = page;

            let pos: "start" | "current" | "end" | "skip" = "skip";
            if (pageNo === 1) pos = "start";
            if (pageNo === count) pos = "end";
            if (current === 1) {
              // 1 23 45 67 89 N
              // * --          -
              if (pageNo === current + 1 || pageNo === current + 2) {
                pos = "current";
              }
            } else if (current === count) {
              // 1 23 45 67 89 N
              //            -- *  
              if (pageNo === current - 1 || pageNo === current - 2) {
                pos = "current";
              }
            } else if (current % 2 === 0) {
              // 1 23 45 67 89 N
              // - *-          -
              // even number, the next 4 
              if (pageNo === current || pageNo === current + 1) {
                pos = "current";
              }
            } else {
              // 1 23 45 67 89 N
              // -       -*    -
              // uneven 
              if (pageNo === current - 1 || pageNo === current) {
                pos = "current";
              }
            }

            if (pos === "skip") {
              if (lastPos !== "skip") {
                ul.appendChild(getPaginationItem(printess, "ellipsis"));
              }
            } else {
              let disable = false;
              if (printess.lockCoverInside()) {
                if (pageNo === 2 || pageNo === count - 2) {
                  disable = true
                }
              }
              ul.appendChild(getPaginationItem(printess, pageNo, spread, page, isActive, true, disable));
            }

            lastPos = pos;
          }
        }


        const next = getPaginationItem(printess, "next");
        if (info.isLast) {
          next.classList.add("disabled");
        }
        ul.appendChild(next);

      }


      pages.appendChild(ul);

      if (printess.pageNavigationDisplay() === "icons") {
        if (lastScrollLeftPos) {
          ul.scrollTo(lastScrollLeftPos, 0);
        }

        // checken ob zu weit an der ecke 
        const active: HTMLDivElement | null = ul.querySelector(".active");
        if (active) {
          const d = 170;
          if (active.offsetLeft - ul.scrollLeft > ul.offsetWidth - d) {
            ul.scrollTo(active.offsetLeft - ul.offsetWidth + d, 0);
          } else if (active.offsetLeft - ul.scrollLeft < d) {
            ul.scrollTo(active.offsetLeft - d, 0)
          }
        }

      }

      if (printess.pageNavigationDisplay() === "icons" && !forMobile) {
        /******************************************************
            Append special mini-tool bar for further options 
         ****************************************************** */
        const cornerTools = document.createElement("div");
        cornerTools.className = "corner-tools";
        if (printess.hasExpertButton()) {
          cornerTools.classList.add("expert-mode");
        }
        if (printess.showSaveButton()) {
          cornerTools.classList.add("save-mode");
        }

        cornerTools.appendChild(getBackUndoMiniBar(printess));

        const priceDiv = document.createElement("div");
        priceDiv.className = "total-price-container";
        priceDiv.id = "total-price-display";
        if (uih_currentPriceDisplay) {
          getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
        } else {
          const h2 = document.createElement("h2");
          h2.innerText = printess.gl(printess.getTemplateTitle());
          priceDiv.appendChild(h2);

          if (printess.getProductInfoUrl()) {
            const infoIcon = printess.getIcon("info-circle");
            infoIcon.classList.add("product-info-icon");
            infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), printess.getProductInfoUrl(), false);
            priceDiv.appendChild(infoIcon);
          }
        }

        cornerTools.appendChild(priceDiv);
        cornerTools.appendChild(getDesktopTitle(printess));

        pages.appendChild(cornerTools);


        const gradient = document.createElement("div");
        gradient.className = "big-gradient";
        pages.appendChild(gradient);

        const gradient2 = document.createElement("div");
        gradient2.className = "big-gradient2";
        pages.appendChild(gradient2);
      }
    }
  }

  /**
   * Book Mode Overlay for Arranging Pages (add, remove, shift)
   */

  function getPageItem(printess: iPrintessApi, pageNo: number, pageIndex: number, spread: iExternalSpreadInfo, prevSpreadId: string, forMobile: boolean): HTMLElement {
    const page = pageIndex === 0 ? "left-page" : "right-page";

    const pageItem = document.createElement("div");
    pageItem.className = "big-page-item" + (forMobile ? " mobile" : "");

    if (spread.index > 0 && spread.pages === 1) {
      pageItem.style.marginLeft = "auto";
    }

    const p = spread && spread.thumbnails ? spread.thumbnails[page === "right-page" ? 1 : 0] ?? null : null;
    const url = p?.url ?? "";
    const thumb = document.createElement("div");
    thumb.className = "big-page-thumb";
    thumb.id = spread ? "thumb_" + spread.spreadId + "_" + (p?.pageId ?? "") : "";
    if (url) {
      thumb.style.backgroundImage = "url(" + url + ")";
      thumb.style.backgroundColor = p?.bgColor ?? "white";
      thumb.style.backgroundPosition = page === "right-page" ? "right" : "left";
    }
    const spreadForWidth = spread || printess.getAllSpreads()[1];
    if (forMobile) {
      thumb.style.height = ((spreadForWidth.height / spreadForWidth.width * (window.innerWidth - 40) * 0.5) * spreadForWidth.pages * 0.42) + "px";
      thumb.style.width = ((window.innerWidth - 40) * 0.5 * 0.42) + "px";
    } else {
      thumb.style.width = (spreadForWidth.width / spreadForWidth.pages / spreadForWidth.height * 150) + "px";
    }

    const caption = document.createElement("div");
    caption.className = "big-page-caption";

    caption.innerText = spread && spread.names[pageIndex] ? spread.names[pageIndex] : pageNo.toString();

    pageItem.appendChild(caption);
    pageItem.appendChild(thumb);

    pageItem.ondragenter = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      let marker: HTMLDivElement;
      if (page === "right-page") {
        marker = <HTMLDivElement>document.querySelector(`[data-after=${spread.spreadId}]`);
      } else {
        marker = <HTMLDivElement>document.querySelector(`[data-before=${spread.spreadId}]`);
      }
      uih_lastDragTarget = page === "right-page" ? spread.spreadId : prevSpreadId;
      if (marker) marker.style.background = "var(--bs-primary)";
    }
    pageItem.ondragover = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      let marker: HTMLDivElement;
      if (page === "right-page") {
        marker = <HTMLDivElement>document.querySelector(`[data-after=${spread.spreadId}]`);
      } else {
        marker = <HTMLDivElement>document.querySelector(`[data-before=${spread.spreadId}]`);
      }
      uih_lastDragTarget = page === "right-page" ? spread.spreadId : prevSpreadId;
      if (marker) marker.style.background = "var(--bs-primary)";
    }
    pageItem.ondragleave = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      let marker: HTMLDivElement;
      if (page === "right-page") {
        marker = <HTMLDivElement>document.querySelector(`[data-after=${spread.spreadId}]`);
      } else {
        marker = <HTMLDivElement>document.querySelector(`[data-before=${spread.spreadId}]`);
      }
      uih_lastDragTarget = undefined;
      if (marker) marker.style.background = "transparent";
    }
    pageItem.ondrop = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
    }

    return pageItem;
  }

  // Indicates where spread will be dropped
  function getSpreadSeparator(spreadId: string, nextSpreadId: string): HTMLElement {
    const separator = document.createElement("li");
    separator.className = "spread-separator";
    separator.id = spreadId + "_separator";

    const marker = document.createElement("div");
    marker.className = "spread-drop-marker";
    marker.setAttribute("data-before", nextSpreadId);
    marker.setAttribute("data-after", spreadId);
    separator.ondragenter = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      uih_lastDragTarget = spreadId;
      marker.style.background = "var(--bs-primary)";
    }
    separator.ondragover = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      uih_lastDragTarget = spreadId;
      marker.style.background = "var(--bs-primary)";
    }
    separator.ondragleave = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      uih_lastDragTarget = undefined;
      marker.style.background = "transparent";
    }
    separator.ondrop = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
    }

    separator.appendChild(document.createElement("div"));
    separator.appendChild(marker);
    return separator;
  }

  function getSpreadItem(printess: iPrintessApi, pageNo: number, forMobile: boolean, spread: iExternalSpreadInfo & { snippetUrl: string }, spreads: Array<iExternalSpreadInfo & { snippetUrl: string }>, snippets: iExternalSnippet[], facingPages: boolean): HTMLElement {
    const canAddRemoveSpread = spread.index !== 0 && spread.index !== spreads.length - 1;
    const addSpreads = printess.isNoOfPagesValid(spreads.length) ? printess.canAddSpreads(spreads.length) : 1;
    const removeSpreads = printess.canRemoveSpreads(spreads.length);

    const spreadItem = document.createElement("li");
    spreadItem.className = "spread-item";
    spreadItem.id = spread.spreadId;

    if (!facingPages && forMobile) {
      spreadItem.style.width = "21%";
    }

    spreadItem.dataset.snippet = spread.snippetUrl;
    spreadItem.draggable = canAddRemoveSpread;
    spreadItem.ondragstart = (ev: DragEvent) => {
      ev.dataTransfer?.setData('text/plain', spread.spreadId);
    }
    spreadItem.ondragend = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      const marker = document.querySelectorAll(".spread-drop-marker");
      marker.forEach(m => (<HTMLDivElement>m).style.background = "transparent");

      const modalBody = document.querySelector("div.modal-body");
      if (modalBody && spreads && spread && uih_lastDragTarget && uih_lastDragTarget !== spread.spreadId) {
        const lastScrollPosition = modalBody.scrollTop;
        const filteredSpreads = spreads.filter(s => s.spreadId !== spread.spreadId);
        const idx = filteredSpreads.findIndex(s => s.spreadId === uih_lastDragTarget);
        filteredSpreads.splice(idx + 1, 0, spread);
        filteredSpreads.forEach((s, i) => s.index = i);
        modalBody.innerHTML = "";
        modalBody.appendChild(getArrangePagesContent(printess, forMobile, snippets, undefined, filteredSpreads, [{ id: spread.spreadId, snippetUrl: "" }]));
        modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
        uih_lastDragTarget = undefined;
      }
    }
    spreadItem.ondrop = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
    }

    spreadItem.onmousedown = () => {
      const hint = document.createElement("div");
      hint.innerText = printess.gl("ui.arrangePagesShortText");
      hint.className = "spread-drag-hint";
      spreadItem.appendChild(hint);
      window.setTimeout(() => {
        spreadItem.removeChild(hint);
      }, 2000);
    }
    spreadItem.ontouchstart = () => {
      const hint = document.createElement("div");
      hint.innerText = printess.gl("ui.arrangePagesShortText");
      hint.className = "spread-drag-hint";
      spreadItem.appendChild(hint);
      window.setTimeout(() => {
        spreadItem.removeChild(hint);
      }, 2000);
    }

    for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
      pageNo++;
      const prevSpreadId = spread.index === 0 ? spread.spreadId : spreads[spread.index - 1].spreadId;
      spreadItem.appendChild(getPageItem(printess, pageNo, pageIndex, spread, prevSpreadId, forMobile));
    }

    if (addSpreads && canAddRemoveSpread) {
      const plusBtn = document.createElement("div");
      plusBtn.className = "add-pages-icon";
      const plusIcon = printess.getIcon("plus");
      plusIcon.classList.add("add-icon");
      plusBtn.appendChild(plusIcon);
      plusBtn.onmousedown = () => {
        addBookPage(printess, spreads, spread, addSpreads, snippets, forMobile);
      }
      plusBtn.ontouchstart = () => {
        addBookPage(printess, spreads, spread, addSpreads, snippets, forMobile);
      }
      spreadItem.appendChild(plusBtn);
    }
    if (removeSpreads && canAddRemoveSpread) {
      const deleteBtn = document.createElement("div");
      deleteBtn.className = "remove-pages-icon";
      const deleteIcon = printess.getIcon("trash");
      deleteIcon.classList.add("delete-btn");
      deleteBtn.onclick = () => {
        spreadItem.classList.add("delete-spread-box", "spread-box", "faded-in")
        requestAnimationFrame(() => {
          spreadItem.classList.remove("faded-in");
          spreadItem.classList.add("faded-out");
        })
        window.setTimeout(() => {
          const separator = document.getElementById(spread.spreadId + "_separator");
          if (separator) separator.remove();
          spreadItem.remove();
          const filteredSpreads = spreads.filter(s => s.spreadId !== spread.spreadId);
          filteredSpreads.forEach((s, i) => s.index = i);
          const modalBody = document.querySelector("div.modal-body");
          if (modalBody) {
            const lastScrollPosition = modalBody.scrollTop;
            modalBody.innerHTML = "";
            modalBody.appendChild(getArrangePagesContent(printess, forMobile, snippets, undefined, filteredSpreads));
            modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
          }
        }, 500);
      }
      deleteBtn.appendChild(deleteIcon);
      spreadItem.appendChild(deleteBtn);
      spreadItem.classList.add("can-add-remove-spread");
    }
    if (canAddRemoveSpread) {
      const moveBtn = document.createElement("div");
      moveBtn.className = "move-pages-icon";
      const moveIcon = printess.getIcon("arrows");
      moveIcon.classList.add("move-icon");
      moveBtn.appendChild(moveIcon);

      // its drag and drop everywhere anyhow
      // spreadItem.appendChild(moveBtn);
    }

    return spreadItem;
  }

  function addBookPage(printess: iPrintessApi, spreads: (iExternalSpreadInfo & { snippetUrl: string; })[], spread: iExternalSpreadInfo, addSpreads: 1 | 2, snippets: iExternalSnippet[], forMobile: boolean) {
    const modalBody = document.querySelector("div.modal-body");
    const newSpreadIds: Array<{ id: string, snippetUrl: string }> = [];
    for (let i = 0; i < addSpreads; i++) {
      const snippet = snippets[Math.floor(Math.random() * snippets.length)];
      const newSpread: iExternalSpreadInfo & { snippetUrl: string } = {
        docId: spread.docId,
        snippetUrl: snippet?.snippetUrl ?? "",
        spreadId: "newSpread_" + Math.floor(Math.random() * (999999 - 100000) + 100000),
        index: spread.index + 1,
        name: "",
        names: spread.pages === 1 ? [""] : ["", ""],
        width: spread.width,
        height: spread.height,
        pages: spread.pages,
        thumbnails: [{ url: snippet?.thumbUrl || "", bgColor: snippet?.bgColor || "white", pageId: "left" }, { url: snippet?.thumbUrl || "", bgColor: snippet?.bgColor || "white", pageId: "right" }]
      }
      const idx = spread.index + 1;
      spreads.sort((a, b) => a.index - b.index);
      for (let i = spread.index + 1; i < spreads.length; i++) {
        spreads[i].index = i + 1;
      }
      spreads.splice(idx, 0, newSpread);
      newSpreadIds.push({ id: newSpread.spreadId, snippetUrl: newSpread.snippetUrl });
    }
    if (modalBody) {
      const lastScrollPosition = modalBody.scrollTop;
      modalBody.innerHTML = "";
      modalBody.appendChild(getArrangePagesContent(printess, forMobile, snippets, undefined, spreads, newSpreadIds));
      modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
    }
  }

  function getArrangePagesContent(printess: iPrintessApi, forMobile: boolean, snippets: iExternalSnippet[], doc?: iExternalDocAndSpreadInfo, spreads?: Array<iExternalSpreadInfo & { snippetUrl: string }>, newSpreadIds?: Array<{ id: string, snippetUrl: string }>, modalFooter?: HTMLDivElement, warning?: HTMLDivElement): HTMLDivElement {
    const content = document.createElement("div");

    if (!forMobile) {
      const infoText = document.createElement("p");
      infoText.className = "arrange-pages-info-text";
      infoText.textContent = printess.gl("ui.arrangePagesInfoText");
      content.appendChild(infoText);
    }

    const scrollTopDiv = document.createElement("div");
    scrollTopDiv.className = "scroll-up-indicator no-selection";

    scrollTopDiv.ondragover = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      const container = document.querySelector(".modal-body");
      if (container) {
        if (forMobile) {
          container.scrollTop -= 10;
        } else {
          container.scrollTo({ top: container.scrollTop - 10, behavior: 'smooth' });
        }
      }
    }

    content.appendChild(scrollTopDiv);

    const ul = document.createElement("div");
    ul.className = "pagination pagination-lg";

    const pagesContainer = document.createElement("ul");
    pagesContainer.className = "pages-container";
    pagesContainer.id = "page-arrange-dialog-spreads";

    const docs = printess.getAllDocsAndSpreads();
    doc = doc || docs.filter(doc => doc.isBook)[0];
    spreads = spreads || doc.spreads.map(x => { return { ...x, snippetUrl: "" } });

    modalFooter = modalFooter || <HTMLDivElement>document.querySelector(".modal-footer");
    warning = warning || <HTMLDivElement>document.getElementById("spread-size-warning");
    if (warning && modalFooter) {
      if (!printess.isNoOfPagesValid(spreads.length)) {
        modalFooter.classList.add("printess-pages-warning");
        warning.style.display = "block";
      } else {
        modalFooter.classList.remove("printess-pages-warning");
        warning.style.display = "none";
      }
    }

    let pageNo = 0;

    for (const spread of spreads) {
      const spreadItem = getSpreadItem(printess, pageNo, forMobile, spread, spreads, snippets, doc.facingPages);
      pagesContainer.appendChild(spreadItem);
      if (newSpreadIds && newSpreadIds.map(x => x.id).includes(spread.spreadId)) {
        spreadItem.classList.add("spread-box", "faded-out")
        requestAnimationFrame(() => {
          spreadItem.classList.remove("faded-out");
        })
      }

      if (spreads[spreads.length - 1] !== spread) {
        const spreadId = spread.spreadId;
        const nextSpreadId = spreads[spread.index + 1].spreadId;
        pagesContainer.appendChild(getSpreadSeparator(spreadId, nextSpreadId));
      }
      pageNo += spread.pages;
    }

    ul.appendChild(pagesContainer);
    content.appendChild(ul);

    const scrollBottomDiv = document.createElement("div");
    scrollBottomDiv.className = "scroll-down-indicator no-selection";

    scrollBottomDiv.ondragover = (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      const container = document.querySelector(".modal-body");
      if (container) {
        if (forMobile) {
          container.scrollTop += 10;
        } else {
          container.scrollTo({ top: container.scrollTop + 10, behavior: 'smooth' });
        }
      }
    }

    content.appendChild(scrollBottomDiv);

    return content;
  }

  // Remove, Add & Rearrange Pages in Photobooks etc.
  async function getArrangePagesOverlay(printess: iPrintessApi, forMobile: boolean): Promise<void> {
    const docs = printess.getAllDocsAndSpreads();
    const doc = docs.filter(doc => doc.isBook)[0];

    const snippets = await printess.getInsertSpreadSnippets();

    const title = printess.gl("ui.arrangePages");

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const warning = document.createElement("div");
    warning.id = "spread-size-warning";
    warning.textContent = doc.facingPages ? printess.gl("ui.twoSpreadWarning") : printess.gl("ui.oneSpreadWarning");

    const close = document.createElement("button");
    close.className = "btn btn-outline-primary";
    close.textContent = printess.gl("ui.buttonCancel");
    close.onclick = () => {
      hideModal("pageArrangementDialog");
    }

    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.id = "apply-book-changes";
    ok.textContent = printess.gl("ui.applyChanges");
    ok.onclick = async () => {
      const allSpreadIds: Array<{ id: string, snippetUrl: string }> = [];
      let showPagesAddedInfo = false;
      for (const div of document.querySelector("#page-arrange-dialog-spreads")?.children ?? []) {
        if (div.classList.contains("spread-item")) {
          const id = (<HTMLDivElement>div).id;
          const snippetUrl = (<HTMLDivElement>div).dataset.snippet ?? "";
          if (id) {
            allSpreadIds.push({ id: id, snippetUrl: snippetUrl });
          }
        }
      }
      if (!printess.isNoOfPagesValid(allSpreadIds.length)) {
        showPagesAddedInfo = true;
        const idx = allSpreadIds.length - 1;
        const url = snippets.length ? snippets[Math.floor(Math.random() * snippets.length)].snippetUrl : ""
        allSpreadIds.splice(idx, 0, { id: "newSpread", snippetUrl: url });
      }

      printess.reArrangeSpreads(allSpreadIds);

      hideModal("pageArrangementDialog");
      if (showPagesAddedInfo) getPagesAddedInfoOverlay(printess, doc.facingPages);
      printess.resizePrintess();
    }

    footer.appendChild(warning);
    footer.appendChild(close);
    footer.appendChild(ok);

    const content = getArrangePagesContent(printess, forMobile, snippets, doc, undefined, undefined, footer, warning);

    showModal(printess, "pageArrangementDialog", content, title, footer);
  }

  // Remove, Add & Rearrange Pages in Photobooks etc.
  function getPagesAddedInfoOverlay(printess: iPrintessApi, facingPages: boolean): void {
    const title = facingPages ? printess.gl("ui.twoPagesAddedTitle") : printess.gl("ui.onePageAddedTitle");

    const content = document.createElement("div");
    content.textContent = facingPages ? printess.gl("ui.twoPagesAddedInfo") : printess.gl("ui.onePageAddedInfo");

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const close = document.createElement("button");
    close.className = "btn btn-primary";
    close.textContent = printess.gl("ui.buttonClose");
    close.onclick = () => {
      hideModal("pageAddedInfoDialog");
    }

    footer.appendChild(close);

    showModal(printess, "pageAddedInfoDialog", content, title, footer);
  }

  /*
   * My Images List
   */

  function renderMyImagesTab(printess: iPrintessApi, forMobile: boolean, p?: iExternalProperty, images?: Array<iExternalImage>, imagesContainer?: HTMLDivElement, showSearchIcon: boolean = true, showMobileImagesUploadBtn: boolean = false): HTMLElement {
    const container = imagesContainer || document.createElement("div");
    container.id = "image-tab-container";
    container.innerHTML = "";

    const imageList = document.createElement("div");
    imageList.classList.add("image-list");
    images = images || printess.getImages(p?.id);

    const dragDropHint = document.createElement("p");
    dragDropHint.style.fontFamily = "var(--bs-font-sans-serif)";
    dragDropHint.style.marginTop = "10px";
    dragDropHint.textContent = printess.gl("ui.dragDropHint");

    // Wenn keine Property gesetzt ist, dann rendern wir den globel My-Images Tab
    if (!p || p?.imageMeta?.canUpload) {
      const distributeBtn = document.createElement("button");
      distributeBtn.id = "distribute-button";
      distributeBtn.className = "btn btn-secondary mb-3"; // my-3 w-100";
      distributeBtn.innerText = printess.gl("ui.buttonDistribute");
      distributeBtn.onclick = () => {
        getDistributionOverlay(printess, forMobile, p, container);
      };

      const twoButtons = document.createElement("div");
      twoButtons.id = "two-buttons";
      twoButtons.style.display = "grid";

      twoButtons.appendChild(getImageUploadButton(printess, p?.id ?? "", false, p !== undefined));

      if (printess.showImageDistributionButton()) {
        // if (images.length > 0 &&  printess.allowImageDistribution()) {
        twoButtons.style.gridTemplateColumns = "1fr 15px 1fr";
        twoButtons.appendChild(document.createElement("div"));
        twoButtons.appendChild(distributeBtn);
        // }
      }

      if (!forMobile || showMobileImagesUploadBtn) container.appendChild(twoButtons);
    }

    const multipleImagesHint = document.createElement("p");
    multipleImagesHint.id = "multiple-images-hint";
    multipleImagesHint.style.fontFamily = "var(--bs-font-sans-serif)";
    multipleImagesHint.textContent = printess.gl("ui.uploadMultipleImagesInfo");
    if (forMobile) multipleImagesHint.style.textAlign = "center";
    if (images.length <= 12 && !p?.id.startsWith("FF_")) container.appendChild(multipleImagesHint);

    if (printess.showSearchBar()) { // && images.length > 5 => searchBar gone after search, if result has 5 or less items only
      container.appendChild(getSearchBar(printess, p, container, forMobile, showSearchIcon));
    }

    const imageGroups = printess.getImageGroups(p?.id);

    if ((!p || p.kind !== "selection-text-style")) {
      if (imageGroups.length > 1) {
        if (images?.filter(i => i.group === uih_activeImageAccordion).length === 0) {
          uih_activeImageAccordion = imageGroups[1];
        }
        const accordion = document.createElement("div");
        accordion.className = "accordion mb-3";
        accordion.id = "accordion_" + p?.id;

        imageGroups.forEach(group => {
          if (images?.filter(i => i.group === group).length) {
            const card = document.createElement("div");
            card.className = "accordion-item";

            const title = document.createElement("h2");
            title.className = "accordion-header";
            title.id = "heading-" + group.replace(" ", "");
            const button = document.createElement("button");
            button.className = `accordion-button ${group === uih_activeImageAccordion ? "" : "collapsed"}`;
            button.style.backgroundColor = "white";
            button.setAttribute("data-bs-toggle", "collapse");
            button.setAttribute("data-bs-target", "#collapse-" + group.replace(" ", ""));
            button.setAttribute("aria-expanded", "true");
            button.setAttribute("aria-controls", "collapse-" + group.replace(" ", ""))
            button.textContent = group === "Buyer Upload" ? printess.gl("ui.imagesTab") : printess.gl(group);
            button.onclick = () => uih_activeImageAccordion = group;

            const collapse = document.createElement("div");
            collapse.className = `accordion-collapse collapse ${group === uih_activeImageAccordion ? "show" : ""}`;
            collapse.setAttribute("aria-labelledby", "heading-" + group.replace(" ", ""));
            collapse.setAttribute("data-bs-parent", "#accordion_" + p?.id);
            collapse.id = "collapse-" + group.replace(" ", "");
            const body = document.createElement("div");
            body.className = "accordion-body";
            const groupList = document.createElement("div");
            groupList.classList.add("image-list");

            for (const im of images?.filter(i => i.group === group)) {
              groupList.appendChild(getImageThumb(printess, p, im, container, groupList, forMobile));
            }

            title.appendChild(button);
            body.appendChild(groupList);
            collapse.appendChild(body);
            card.appendChild(title);
            card.appendChild(collapse);
            accordion.appendChild(card);
          }
        });

        container.appendChild(accordion);

        if (p && p.imageMeta?.canSetDefaultImage && p.validation?.defaultValue !== "fallback") {
          const resetButton = getDefaultImageButton(printess, p, "button");
          container.appendChild(resetButton);
        }

      } else {

        if (p && p.imageMeta?.canSetDefaultImage && p.validation?.defaultValue !== "fallback") {
          const defaultThumb = getDefaultImageButton(printess, p, "div");
          imageList.appendChild(defaultThumb);
        }

        for (const im of images) {
          imageList.appendChild(getImageThumb(printess, p, im, container, imageList, forMobile));
        }

        container.appendChild(imageList);
      }
    }
    if (!forMobile && images.length > 0 && p?.kind !== "image-id") container.appendChild(dragDropHint);

    return container;
  }

  // Buttons for Resetting to Default Image
  function getDefaultImageButton(printess: iPrintessApi, p: iExternalProperty, type: "div" | "button"): HTMLElement {
    const resetButton = document.createElement(type);

    if (type === "button") {
      resetButton.className = "btn btn-secondary w-100";
      resetButton.textContent = printess.gl("ui.resetToDefaultImage");
    } else {
      resetButton.className = "default-img-thumb";

      if (p.validation?.defaultValue === p.value) {
        resetButton.style.border = "2px solid var(--bs-primary)";
        resetButton.style.outline = "3px solid var(--bs-primary)";
      }

      const icon = printess.getIcon("camera-slash");
      icon.style.width = "55px";
      icon.style.height = "55px";
      resetButton.appendChild(icon);
    }

    resetButton.onclick = async () => {
      if (p && p.validation && p.imageMeta) {
        const pValue = p.validation.defaultValue;
        await printess.setProperty(p.id, pValue);
        p.value = pValue;
        if (p.imageMeta) {
          p.imageMeta.canScale = false;
        }

        const propsDiv = document.getElementById("tabs-panel-" + p.id);
        if (propsDiv) {
          propsDiv.replaceWith(getPropertyControl(printess, p));
        }
      }
    }

    return resetButton;
  }

  // get image thumb for image preview
  function getImageThumb(printess: iPrintessApi, p: iExternalProperty | undefined, im: iExternalImage, container: HTMLDivElement, imageList: HTMLDivElement, forMobile: boolean): HTMLElement {
    const thumb = document.createElement("div");
    thumb.className = "big";
    thumb.draggable = true;
    thumb.ondragstart = (ev: DragEvent) => {
      if (p?.kind === "image-id") {
        ev.preventDefault();
      }
      ev.dataTransfer?.setData('text/plain', `${im.id}`)
    };
    thumb.style.backgroundImage = im.thumbCssUrl;
    thumb.style.position = "relative";
    thumb.style.width = "91px";
    thumb.style.height = "91px";
    if (im.inUse) {
      if (im.useCount > 1) {
        const box = document.createElement("div");
        box.className = "image-inuse-checker use-count";
        const span = document.createElement("span");
        span.textContent = im.useCount.toString();
        box.appendChild(span);
        thumb.appendChild(box);
      } else {
        const chk = printess.getIcon("check-square");
        chk.classList.add("image-inuse-checker");
        thumb.appendChild(chk);
      }
    } else {
      const cls = document.createElement("div");
      cls.classList.add("delete-btn-container");
      const icon = printess.getIcon("trash");
      icon.classList.add("delete-btn");
      icon.onclick = (e) => {
        e.stopImmediatePropagation();
        imageList.removeChild(thumb);
        printess.deleteImages([im]);
      }
      cls.appendChild(icon);
      if (forMobile) cls.style.display = "block";
      if (!p || p?.imageMeta?.canUpload) thumb.appendChild(cls);
    }
    //  thumb.style.opacity = im.inUse ? "0.5" : "1.0";

    if (p) {
      if (im.id === p.value) {
        thumb.style.border = "2px solid var(--bs-primary)";
        thumb.style.outline = "3px solid var(--bs-primary)";
      }
      thumb.onclick = async () => {
        const scaleHints = await printess.setProperty(p.id, im.id);
        p.value = im.id;
        if (scaleHints && p.imageMeta) {
          p.imageMeta.scaleHints = scaleHints;
          p.imageMeta.scale = scaleHints.scale;
          p.imageMeta.thumbCssUrl = im.thumbCssUrl;
          p.imageMeta.thumbUrl = im.thumbUrl;
          p.imageMeta.canScale = printess.canScale(p.id);
        }
        if (forMobile) {

          const mobileButtonsContainer = document.querySelector(".mobile-buttons-container");
          if (mobileButtonsContainer) {
            mobileButtonsContainer.innerHTML = "";
            getMobileButtons(printess, <HTMLDivElement>mobileButtonsContainer, p.id, true, true);
          }

          /* const mobileButtonDiv = document.getElementById(p.id + ":");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
          }
          const mobileButtonDivScale = document.getElementById(p.id + ":image-scale");
          if (mobileButtonDivScale) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDivScale, [p]);
          } */

          const newImages = printess.getImages(p?.id);
          renderMyImagesTab(printess, forMobile, p, newImages, container);

          closeMobileFullscreenContainer();

        } else {
          const propsDiv = document.getElementById("tabs-panel-" + p.id);
          if (propsDiv) {
            propsDiv.replaceWith(getPropertyControl(printess, p));
          }
        }

        // validate(printess, p);
      }
    } else {
      // MyImages-Tab mode, no property is selected 
      thumb.onclick = async () => {
        printess.assignImageToNextPossibleFrame(im.id);
        if (forMobile) {
          closeMobileFullscreenContainer();
        }
      }
    }
    return thumb;
  }

  // get Search Bar for images
  function getSearchBar(printess: iPrintessApi, p: iExternalProperty | undefined, container: HTMLDivElement, forMobile: boolean, showSearchIcon: boolean): HTMLElement {
    const searchWrapper = document.createElement("div");
    searchWrapper.className = "d-flex mb-3 position-relative";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "form-control";
    searchInput.id = "search-input";
    searchInput.placeholder = printess.gl("ui.search");
    const searchBtn = document.createElement("button");
    searchBtn.className = showSearchIcon ? "btn btn-primary" : "btn btn-secondary";
    searchBtn.id = "search-btn";
    let searchIcon = showSearchIcon ? printess.getIcon("search-light") : printess.getIcon("close");
    searchIcon.style.height = "20px";

    // show list of matching values
    searchInput.oninput = () => {
      // set close icon to search icon when typing
      searchBtn.className = "btn btn-primary";
      searchBtn.innerHTML = "";
      searchIcon = printess.getIcon("search-light");
      searchIcon.style.height = "20px";
      searchBtn.appendChild(searchIcon);

      const searchValue = <HTMLInputElement>document.getElementById("search-input");
      const list = document.getElementById("search-list") || document.createElement("ul");
      list.className = "list-group position-absolute";
      list.id = "search-list";
      list.style.top = "38px";
      list.style.left = "0";
      list.style.width = "100%";
      list.style.zIndex = "10";
      list.style.boxShadow = "0 2px 5px 0 rgba(0,0,0,.2),0 2px 10px 0 rgba(0,0,0,.1)";
      list.innerHTML = "";

      printess.getImageGroups(p?.id).filter(g => g !== "Buyer Upload" && g.toLowerCase().includes(searchValue.value.toLowerCase())).forEach(group => {
        const images = printess.getImages(p?.id);
        if (images?.filter(i => i.group === group).length) {
          const listItem = document.createElement("li");
          listItem.className = "list-group-item search-list-item";
          listItem.textContent = group;
          listItem.onclick = () => {
            const images = printess.getImages(p?.id);
            const newImages = images?.filter(i => i.group === group);
            renderMyImagesTab(printess, forMobile, p, newImages, container, false);
          }
          list.appendChild(listItem);
        }
      })

      if (searchValue.value.trim() === "") {
        list.innerHTML = "";
      }

      searchWrapper.appendChild(list);
    }

    // filter groups according to search string
    searchBtn.onclick = () => {
      const images = printess.getImages(p?.id);
      const searchValue = <HTMLInputElement>document.getElementById("search-input");
      const newImages = images?.filter(i => i.group.toLowerCase().includes(searchValue.value.toLocaleLowerCase()));

      if (searchValue.value.trim() === "") {
        renderMyImagesTab(printess, forMobile, p, newImages, container, true);
      } else {
        renderMyImagesTab(printess, forMobile, p, newImages, container, false);
      }
    }

    searchBtn.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(searchBtn);

    return searchWrapper;
  }

  // Mobile Properties Caption
  function getMobilePropertiesCaption(printess: iPrintessApi, tabs: Array<iExternalTab> = uih_currentTabs): string {
    if (uih_currentTabId === "LOADING") {
      uih_currentTabId = printess.getInitialTabId() === "#FORMFIELDS" ? tabs[0]?.id : printess.getInitialTabId();
    }

    let caption = "";
    const currentTab = tabs.filter(t => t.id === uih_currentTabId)[0] || "";
    if (currentTab) {
      caption = currentTab.head || currentTab.caption;
    }

    return caption
  }

  // Fullscreen Dialogs on mobile
  function renderMobileDialogFullscreen(printess: iPrintessApi, id: string, caption: string, content: HTMLElement, addTabsNavigation: boolean = true): void {
    const container = document.createElement("div");
    container.id = id;
    container.className = "fullscreen-mobile-dialog show-image-list";

    getMobileFullscreenContent(printess, id, container, caption, content, addTabsNavigation);

    document.body.appendChild(container);
  }

  // Fullscreen Properties View with Tabs Navigation
  function renderMobilePropertiesFullscreen(printess: iPrintessApi, id: string, state: "open" | "closed"): void {
    let container: HTMLDivElement | null = document.querySelector(".fullscreen-add-properties");

    if (!container) {
      container = document.createElement("div");
      container.className = "fullscreen-add-properties image-list-preset";
    } else {
      container.innerHTML = "";
      container.className = "fullscreen-add-properties image-list-preset";
    }

    if (state === "open") container.className = "fullscreen-add-properties show-image-list";

    if (printess.showTabNavigation()) {
      container.classList.add("mobile-tabs");
      const caption = getMobilePropertiesCaption(printess, uih_currentTabs);
      const propsContainer = document.createElement("div");
      renderTabNavigationProperties(printess, propsContainer, true);
      getMobileFullscreenContent(printess, id, container, caption, propsContainer, true);
    } else {
      const groupSnippets = renderGroupSnippets(printess, uih_currentGroupSnippets, true);
      getMobileFullscreenContent(printess, "add-design", container, "ui.addDesign", groupSnippets, false);
    }

    openMobileFullscreenContainer("add-properties");

    document.body.appendChild(container);
  }

  // Fullscreen Image List on Mobile
  function renderMobileImageListFullscreen(printess: iPrintessApi, id: string, title: string, tabContent: HTMLElement, p?: iExternalProperty): HTMLElement {
    let container: HTMLDivElement | null = document.querySelector(".image-list-fullscreen");
    if (!container) {
      container = document.createElement("div");
      container.className = "image-list-fullscreen image-list-preset";
    } else {
      container.innerHTML = "";
      container.className = "image-list-fullscreen image-list-preset";
    }

    getMobileFullscreenContent(printess, id, container, title, tabContent, false, p);

    return container;
  }

  function getMobileFullscreenContent(printess: iPrintessApi, id: string, container: HTMLElement, title: string, tabContent: HTMLElement, addTabsNavigation: boolean, p?: iExternalProperty): void {
    const header = document.createElement("div");
    header.className = "image-list-header bg-primary text-light";
    header.innerHTML = printess.gl(title).replace(/\\n/g, " ");
    const exitBtn = printess.getIcon("close");
    exitBtn.style.width = "20px";
    exitBtn.style.height = "24px";
    exitBtn.onclick = () => {
      container?.classList.remove("show-image-list");
      container?.classList.add("hide-image-list");

      closeMobileExternalLayoutsContainer();

      if (id === "CROPMODAL" || id === "PRICE-INFO") {
        window.setTimeout(() => hideModal(id), 1000);
      }
    }
    header.appendChild(exitBtn);

    const content = document.createElement("div");
    content.className = "mobile-fullscreen-content";
    content.id = id + "_" + p?.id ?? "";
    content.appendChild(tabContent);

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs-navigation";
    renderTabsNavigation(printess, tabsContainer, true);

    container.appendChild(header);
    container.appendChild(content);
    if (addTabsNavigation) container.appendChild(tabsContainer);
  }

  function updateMobilePropertiesFullscreen(printess: iPrintessApi): void {
    const imageListHeader = <HTMLElement>document.querySelector(".fullscreen-add-properties .image-list-header");
    if (imageListHeader) {
      const caption = getMobilePropertiesCaption(printess, uih_currentTabs);
      imageListHeader.innerHTML = caption.replace(/\\n/g, " ");
      const exitBtn = printess.getIcon("close");
      exitBtn.style.width = "20px";
      exitBtn.style.height = "24px";
      exitBtn.onclick = () => {
        closeMobileFullscreenContainer();
      }
      imageListHeader.appendChild(exitBtn);
    }
    const propsContainer = <HTMLElement>document.querySelector(".fullscreen-add-properties .mobile-fullscreen-content");
    if (propsContainer) {
      propsContainer.innerHTML = "";
      renderTabNavigationProperties(printess, propsContainer, true);
    }
  }

  function openMobileFullscreenContainer(type: "image-list" | "add-properties"): void {
    let fullscreenContainer: HTMLDivElement | null
    if (type === "add-properties") {
      fullscreenContainer = document.querySelector(".fullscreen-add-properties");
    } else {
      fullscreenContainer = document.querySelector(".image-list-fullscreen");
    }

    if (fullscreenContainer) {
      fullscreenContainer.classList.remove("image-list-preset");
      fullscreenContainer.classList.remove("hide-image-list");
      fullscreenContainer.classList.add("show-image-list");
    }

    const externalLayoutsContainer = document.getElementById("external-layouts-container");
    if (externalLayoutsContainer) {
      externalLayoutsContainer.classList.remove("hide-external-layouts-container");

      if (uih_currentTabId !== "#LAYOUTS" || type === "image-list") {
        externalLayoutsContainer.style.display = "none";
      } else {
        externalLayoutsContainer.classList.add("show-external-layouts-container");
        externalLayoutsContainer.classList.add("open-external-layouts-container");
      }
    }
  }

  function closeMobileExternalLayoutsContainer(): void {
    const externalLayoutsContainer = document.getElementById("external-layouts-container");
    if (externalLayoutsContainer) {
      externalLayoutsContainer.classList.remove("show-external-layouts-container");
      externalLayoutsContainer.classList.remove("open-external-layouts-container");
      externalLayoutsContainer.classList.add("hide-external-layouts-container");
    }
  }

  function closeMobileFullscreenContainer(): void {
    closeMobileExternalLayoutsContainer();

    const fullscreenContainer = document.querySelector(".fullscreen-add-properties.show-image-list") || document.querySelector(".image-list-fullscreen.show-image-list");

    if (fullscreenContainer) {
      fullscreenContainer.classList.remove("show-image-list");
      fullscreenContainer.classList.add("hide-image-list");
    }
  }

  function removeMobileFullscreenContainer(): void {
    closeMobileExternalLayoutsContainer();

    const fullscreenContainer = document.querySelector(".fullscreen-add-properties");
    const imageListContainer = document.querySelector(".image-list-fullscreen");

    if (fullscreenContainer) fullscreenContainer.remove();
    if (imageListContainer) imageListContainer.remove();
  }

  // Images on Mobile
  function renderImageControlButtons(printess: iPrintessApi, images: iExternalImage[], p?: iExternalProperty): HTMLElement {

    const forHandwriting = p?.kind === "selection-text-style";

    const container = document.createElement("div");
    container.id = "image-control-buttons";
    container.style.display = "grid";
    container.style.gridTemplateColumns = (images.length > 0 && !forHandwriting) ? "1fr 1fr" : "1fr";
    container.style.gridGap = "5px";

    // render Fullscreen Images List
    const tabContent = renderMyImagesTab(printess, true, p, undefined);
    const fullscreenContainer = renderMobileImageListFullscreen(printess, "images-list", "ui.exchangeImage", tabContent, p);
    document.body.appendChild(fullscreenContainer);

    // Change Image button
    const change = document.createElement("button");
    change.className = "btn btn-outline-primary exchange-image-btn";
    change.textContent = printess.gl("ui.exchangeImage");

    change.onclick = () => {
      openMobileFullscreenContainer("image-list");
    }

    const changeIcon = printess.getIcon("image");
    changeIcon.style.height = "50px";
    change.appendChild(changeIcon);

    // add upload button and change button to container in controlhost
    const handwritingCaption: string = forHandwriting ? printess.gl("ui.uploadHandwriting") : "";
    container.appendChild(getImageUploadButton(printess, p?.id || "images", true, true, handwritingCaption));
    if (images.length > 0 && !forHandwriting) {
      container.appendChild(change);
    }
    return container;
  }

  // open dialog to confirm distribution of images
  function getDistributionOverlay(printess: iPrintessApi, forMobile: boolean, p?: iExternalProperty, container?: HTMLDivElement): void {
    const content = document.createElement("div");
    content.className = "d-flex flex-column align-items-center";
    const id = "DISTRIBUTEMODAL";

    const txt = document.createElement("p");
    txt.textContent = printess.gl("ui.distributionText");

    const icon = printess.getIcon("distribute-image");
    icon.style.width = "200px";

    content.appendChild(txt);
    content.appendChild(icon);

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const close = document.createElement("button");
    close.className = "btn btn-secondary";
    close.textContent = printess.gl("ui.buttonNo");
    close.onclick = () => {
      hideModal(id);
    }

    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = printess.gl("ui.buttonYes");
    ok.onclick = async () => {
      hideModal(id);
      await printess.distributeImages();
      renderMyImagesTab(printess, forMobile, p, printess.getImages(p?.id), container);
    }

    footer.appendChild(close);
    footer.appendChild(ok);

    showModal(printess, id, content, printess.gl("ui.distributionDialogTitle"), footer);
  }

  /*
   * Accordion Items
   */

  function renderAccordionItem(printess: iPrintessApi, title: string, body: HTMLDivElement, hideCollapseIcon: boolean): HTMLElement {
    const forPhotoTab = uih_currentTabId === "#PHOTOS" && printess.showTabNavigation();
    const accordionItem = document.createElement("div");
    accordionItem.className = "accordion-item";
    accordionItem.style.border = "none";

    const headerId = title.split(" ").join("") + "_PanelHeader";
    const bodyId = title.split(" ").join("") + "_PanelBody";
    const header = document.createElement("h2");
    header.className = "accordion-header";
    header.id = headerId;
    header.style.borderBottom = "1px solid rgba(0,0,0,.125)";
    if (!forPhotoTab) accordionItem.appendChild(header);

    const accordionBtn = document.createElement("button");
    accordionBtn.className = "accordion-button";
    accordionBtn.style.backgroundColor = "white";
    accordionBtn.setAttribute("data-bs-toggle", "collapse");
    accordionBtn.setAttribute("data-bs-target", "#" + bodyId);
    accordionBtn.style.boxShadow = "none";
    accordionBtn.textContent = title;
    accordionBtn.onclick = () => {
      const collapseButtons = document.querySelectorAll("button.accordion-collapse-btn.disabled");
      collapseButtons?.forEach(b => b.classList.remove("disabled"));
    }
    header.appendChild(accordionBtn);

    if (hideCollapseIcon) accordionBtn.classList.add("no-after");

    const bodyContainer = document.createElement("div");
    bodyContainer.className = "accordion-collapse collapse show";
    bodyContainer.id = bodyId;
    accordionItem.appendChild(bodyContainer);

    const accordionBody = document.createElement("div");
    accordionBody.className = "accordion-body";
    accordionBody.style.padding = "0.75rem 0.5rem";
    accordionBody.appendChild(body);
    bodyContainer.appendChild(accordionBody);

    return accordionItem;
  }

  /*
   * Collapse & Expand All Buttons for Accordion
   */

  function renderCollapseButtons(printess: iPrintessApi): HTMLElement {
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "d-flex flex-row";

    const collapseAllButton = document.createElement("button");
    collapseAllButton.className = "btn btn-outline-primary accordion-collapse-btn me-1 mb-3 w-100";
    collapseAllButton.textContent = printess.gl("ui.collapseAll");
    collapseAllButton.onclick = () => {
      const accordionButtons = document.querySelectorAll("button.accordion-button");
      accordionButtons?.forEach(b => {
        b.classList.add("collapsed");
      });
      const accordionBodys = document.querySelectorAll("div.accordion-collapse.collapse.show");
      accordionBodys?.forEach(b => b.classList.remove("show"));
      collapseAllButton.classList.add("disabled");
      expandAllButton.classList.remove("disabled");
    }

    const expandAllButton = document.createElement("button");
    expandAllButton.className = "btn btn-outline-primary accordion-collapse-btn mb-3 w-100 disabled";
    expandAllButton.textContent = printess.gl("ui.expandAll");
    expandAllButton.onclick = () => {
      const accordionButtons = document.querySelectorAll("button.accordion-button");
      accordionButtons?.forEach(b => {
        b.classList.remove("collapsed");
      });
      const accordionBodys = document.querySelectorAll("div.accordion-collapse.collapse");
      accordionBodys?.forEach(b => b.classList.add("show"));
      expandAllButton.classList.add("disabled");
      collapseAllButton.classList.remove("disabled");
    }

    buttonWrapper.appendChild(collapseAllButton);
    buttonWrapper.appendChild(expandAllButton);

    return buttonWrapper;
  }

  /*
   * Snippets Lists
   */

  function renderGroupSnippets(printess: iPrintessApi, groupSnippets: Array<iExternalSnippetCluster>, forMobile: boolean): HTMLElement {

    const forPhotoTab = uih_currentTabId === "#PHOTOS" && printess.showTabNavigation();
    const div = document.createElement("div");
    div.className = forMobile ? "group-snippets" : "accordion";
    div.id = "group-snippets";

    if (groupSnippets.length > 0) {
      // no selection, show add-able snippets instead
      for (const cluster of groupSnippets) {

        if (forMobile && !forPhotoTab) {
          const headline = document.createElement("h5");
          headline.className = "snippet-cluster-name";
          headline.textContent = cluster.name;
          div.appendChild(headline)
          const hr = document.createElement("hr");
          hr.style.width = "100%";
          div.appendChild(hr);
        }

        const body = document.createElement("div");
        body.className = "d-grid";
        body.style.gridTemplateColumns = "1fr 1fr 1fr";
        body.style.gridGap = "6px";

        for (const snippet of cluster.snippets) {
          const thumbDiv = document.createElement("div");
          thumbDiv.className = "snippet-thumb";
          const thumb = document.createElement("img");
          thumb.src = snippet.thumbUrl;
          thumb.style.backgroundColor = snippet.bgColor;
          thumbDiv.appendChild(thumb);
          thumbDiv.draggable = true;
          thumbDiv.ondragstart = (ev: DragEvent) => {
            ev.dataTransfer?.setData('text/plain', `${"SNIP:" + snippet.snippetUrl}`)
          };

          const priceBox = document.createElement("span");
          priceBox.className = "badge bg-primary";
          priceBox.textContent = printess.gl(snippet.priceLabel);
          if (snippet.priceLabel) thumbDiv.appendChild(priceBox);

          thumbDiv.onclick = () => {
            const propsDiv = document.getElementById("desktop-properties");
            if (propsDiv && !forMobile && printess.showTabNavigation()) {
              uih_snippetsScrollPosition = propsDiv.scrollTop;
            }
            if (forMobile) {
              closeMobileFullscreenContainer();
              div.innerHTML === "";
            }
            printess.insertGroupSnippet(snippet.snippetUrl);
          }

          forMobile ? div.appendChild(thumbDiv) : body.appendChild(thumbDiv);
        }

        if (!forMobile) {
          div.appendChild(renderAccordionItem(printess, cluster.name, body, groupSnippets.length < 2));
        }
      }
    }
    if (forMobile) {
      const mobile = document.createElement("div");
      mobile.className = "mobile-group-snippets-container";
      div.style.marginTop = forPhotoTab ? "0px" : "-20px";
      mobile.appendChild(div);
      return mobile;
    } else {
      if (groupSnippets.length > 3) {
        const desktop = document.createElement("div");
        desktop.appendChild(renderCollapseButtons(printess));
        desktop.appendChild(div);
        return desktop;
      } else {
        return div;
      }
    }
  }

  // Handle external layout snippets display and return a HTMLDivElement which replaces the internal layout-snippet-list
  function getExternalSnippetDiv(printess: iPrintessApi, layoutSnippets: iExternalSnippetCluster[], forMobile: boolean, forLayoutDialog: boolean = false): HTMLDivElement {
    /**
     * customLayoutSnippetRenderCallback will be called with those parameters and expects 
     * a HTMLDivElement as return value.
     * printess: iPrintessApi, 
     * layoutSnippets: Array<iExternalSnippetCluster>, 
     * forMobile?: boolean, 
     * forLayoutDialog: boolean = false
     * insertTemplateAsLayoutSnippet-Callback 
     * cancelCallback
     * 
     * @return  HTMLDivElement 
     */
    const modalHtml = (<any>window).uiHelper.customLayoutSnippetRenderCallback(printess, layoutSnippets, forMobile, forLayoutDialog, (templateName: string, templateVersion: "draft" | "published", documentName: string, mode: "layout" | "group" = "layout") => {

      // insert layouts callback => add layout snippet and close dialogs / offcanvas

      printess.insertTemplateAsLayoutSnippet(templateName, templateVersion, documentName, mode);
      closeLayoutOverlays(printess, forMobile);

    }, () => {
      // cancel callback => close dialogs / offcanvas
      closeLayoutOverlays(printess, forMobile);
    });

    modalHtml.id = "external-layouts-content";

    return modalHtml;
  }

  function renderLayoutSelectionDialog(printess: iPrintessApi, layoutSnippets: iExternalSnippetCluster[], forMobile: boolean): void {
    const modalId = "layoutSnippetsSelection";
    const templateTitle = printess.getTemplateTitle();
    const title = templateTitle ? printess.gl("ui.selectLayoutTitle", templateTitle) : printess.gl("ui.selectLayoutWithoutTitle");

    const layoutContainer: HTMLDivElement = document.createElement("div");
    layoutContainer.style.height = "calc(100% - 3.5rem)";

    const infoText = document.createElement("p");
    infoText.innerHTML = printess.gl("ui.selectLayoutInfo", printess.getTemplateTitle());

    layoutContainer.appendChild(infoText);
    layoutContainer.appendChild(renderLayoutSnippets(printess, layoutSnippets, forMobile, true));

    showModal(printess, modalId, layoutContainer, title);
  }

  function closeLayoutOverlays(printess: iPrintessApi, forMobile: boolean) {
    // close off canvas via its button, the only way it propably worked ...
    const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
    if (myOffcanvas) myOffcanvas.click();

    const offCanvas = document.getElementById("layoutOffcanvas");
    if (offCanvas) offCanvas.style.visibility = "hidden";

    const layoutsDialog = document.getElementById("layoutSnippetsSelection");
    if (layoutsDialog) layoutsDialog.remove();

    if (printess.showTabNavigation()) {
      closeMobileFullscreenContainer();
    }
  }

  function renderLayoutSnippets(printess: iPrintessApi, layoutSnippets: Array<iExternalSnippetCluster>, forMobile?: boolean, forLayoutDialog: boolean = false): HTMLDivElement {

    if ((<any>window).uiHelper.customLayoutSnippetRenderCallback && layoutSnippets) {
      const externalSnippetContainer = getExternalSnippetDiv(printess, layoutSnippets, forMobile ?? uih_currentRender === "mobile", forLayoutDialog);
      if (externalSnippetContainer && externalSnippetContainer.nodeType) { // && externalSnippetContainer instanceof Element) {
        return externalSnippetContainer;
      }
    }

    const container = document.createElement("div");
    container.className = "layout-snippet-list";
    if (layoutSnippets) {
      for (const cluster of layoutSnippets) {
        const headline = document.createElement("div");
        headline.textContent = cluster.name;
        headline.className = "snippet-cluster-name";
        if (cluster === layoutSnippets[0]) {
          headline.style.marginTop = "0";
        }
        if (!forLayoutDialog) {
          container.appendChild(headline);
        }

        const clusterDiv = document.createElement("div");
        clusterDiv.className = "layout-snippet-cluster";

        if (!forLayoutDialog) {
          const col = printess.numberOfColumns();
          clusterDiv.style.display = "grid";
          clusterDiv.style.gridTemplateColumns = `repeat(${col}, 1fr)`;
          clusterDiv.style.gridGap = "6px";
        }

        for (const snippet of cluster.snippets) {
          const thumbDiv = document.createElement("div");
          thumbDiv.className = forLayoutDialog ? "snippet-thumb layout-dialog" : "snippet-thumb big";
          thumbDiv.setAttribute("aria-label", "Close");
          thumbDiv.setAttribute("data-bs-dismiss", "offcanvas");
          thumbDiv.setAttribute("data-bs-target", "#layoutOffcanvas");

          const thumb = document.createElement("img");
          thumb.src = snippet.thumbUrl;
          thumb.style.backgroundColor = snippet.bgColor;
          thumbDiv.appendChild(thumb);

          const priceBox = document.createElement("span");
          priceBox.className = "badge bg-primary"; //"snippet-price-box";
          priceBox.textContent = printess.gl(snippet.priceLabel);
          if (snippet.priceLabel) thumbDiv.appendChild(priceBox);

          thumbDiv.onclick = () => {
            const propsDiv = document.getElementById("desktop-properties");
            if (propsDiv && !forMobile && printess.showTabNavigation()) {
              uih_snippetsScrollPosition = propsDiv.scrollTop;
            }
            printess.insertLayoutSnippet(snippet.snippetUrl);
            // close layout dialogs / canvas
            closeLayoutOverlays(printess, forMobile ?? uih_currentRender === "mobile");
          }
          clusterDiv.appendChild(thumbDiv);
        }

        if (forLayoutDialog) {
          container.classList.add("accordion");
          container.appendChild(renderAccordionItem(printess, cluster.name, clusterDiv, layoutSnippets.length < 2));
        } else {
          container.appendChild(clusterDiv);
        }
      }
    }
    return container;
  }

  /*
   *   Table Controls
   */
  let tableEditRow: Record<string, string | number | boolean> = {};
  let tableEditRowIndex = -1;

  function getTableControl(printess: iPrintessApi, p: iExternalProperty, _forMobile: boolean): HTMLElement {
    const container = document.createElement("div");
    let hasRow = false;
    if (p.tableMeta) {

      let data: any[] = [];
      try {
        data = JSON.parse(p.value.toString() || "[]");
      } catch (error) {
        data = [];
      }

      if (data.length > 0) {
        const table = document.createElement("table");
        table.className = "table mb-3";
        const thead = document.createElement("thead");
        let tr = document.createElement("tr");
        for (const col of p.tableMeta.columns) {
          if (p.tableMeta.tableType !== "calendar-events" || (col.name !== "month" && col.name !== "event")) {
            const th = document.createElement("th");
            th.scope = "col";
            th.innerText = col.label && printess.gl(col.label) || printess.gl(col.name);
            tr.appendChild(th);
          }
        }

        const th = document.createElement("th");
        th.scope = "col";
        tr.appendChild(th);

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        let rowNumber = 0;
        const selectedRowNumber = printess.getTableRowIndex(p.id)
        for (const row of data) {
          if (p.tableMeta.tableType !== "calendar-events" || row.month == p.tableMeta.month) {
            tr = document.createElement("tr");
            if (selectedRowNumber == rowNumber) {
              tr.classList.add("table-active");
            }
            tr.dataset.rowNumber = rowNumber.toString();
            for (const col of p.tableMeta.columns) {
              if (p.tableMeta.tableType !== "calendar-events" || (col.name !== "month" && col.name !== "event")) {
                const td = document.createElement("td");
                td.innerText = printess.gl(row[col.name]?.toString() ?? "");
                tr.appendChild(td);
              }
            }

            const td = document.createElement("td");
            td.style.width = "30px";
            const icon = printess.getIcon("pen");
            icon.style.padding = "0";
            icon.style.width = "25px";
            icon.style.height = "25px";
            icon.style.cursor = "pointer";
            td.appendChild(icon);
            tr.appendChild(td);

            tr.onclick = (ele: any) => {
              // tr.classList.add("table-active");
              const rowIndex = parseInt(ele.currentTarget.dataset.rowNumber);
              if (rowIndex >= 0) {
                for (const row of ele.currentTarget.parentElement.children) {
                  row.classList.remove("table-active");
                  ele.currentTarget.classList.add("table-active");
                }
              }
              tableEditRow = data[rowIndex];
              tableEditRowIndex = rowIndex;
              printess.setTableRowIndex(p.id, rowIndex);
              renderTableDetails(printess, p, false);

            };
            tbody.appendChild(tr);
            hasRow = true;
          }
          rowNumber++;
        }
        table.appendChild(tbody);
        if (hasRow) container.appendChild(table);
      }
      const addButton = document.createElement("button");
      addButton.className = "btn btn-primary mb-3";
      addButton.innerText = p.tableMeta.tableType === "calendar-events" ? printess.gl("ui.newEvent") : printess.gl("ui.newEntry");
      addButton.onclick = () => {
        if (p.tableMeta) {
          tableEditRowIndex = -1;
          tableEditRow = {};
          for (const col of p.tableMeta.columns) {
            tableEditRow[col.name] = col.list ? col.list[0] : col.data === "number" ? 0 : "";
          }
          if (p.tableMeta.tableType === "calendar-events") {
            tableEditRow.month = p.tableMeta.month || 1;
            tableEditRow.event = "Birthday";
          }
        }
        renderTableDetails(printess, p, false);
      }
      container.appendChild(addButton);
    }

    const details = document.createElement("div");
    details.id = "tableDetails_" + p.id;
    details.className = "container-fluid border"
    container.appendChild(details);

    return container;
  }

  function renderTableDetails(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
    const details: HTMLElement | null = forMobile ? document.createElement("div") : document.getElementById("tableDetails_" + p.id);

    if (!details || !p.tableMeta) return document.createElement("div");


    details.innerHTML = "";

    if (p.tableMeta?.tableType === "calendar-events") {
      const group = document.createElement("div");
      group.className = "input-group mb-3";
      for (const col of p.tableMeta.columns) {
        if (col.name === "day") {
          const dayDiv = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
          dayDiv.style.flexBasis = "80px"; //col.width ||
          dayDiv.style.marginRight = "10px"
          group.appendChild(dayDiv)
        } else if (col.name === "text") {
          const text = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
          text.style.flexGrow = "1";
          text.style.flexBasis = "80px"
          text.style.marginRight = "10px"
          group.appendChild(text)
        }
      }
      details.appendChild(group);
    } else {
      for (const col of p.tableMeta.columns) {
        if (col.list?.length) {
          details.appendChild(getTableDetailsDropDown(printess, p, tableEditRowIndex, tableEditRow, col, false, true))
        } else {
          details.appendChild(getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false))
        }
      }
    }

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary mb-3 float-left";
    if (tableEditRowIndex === -1) {
      submitButton.innerText = printess.gl("ui.buttonAdd");
    } else {
      submitButton.innerText = printess.gl("ui.buttonSubmit");
    }
    submitButton.onclick = () => {
      if (p.tableMeta?.tableType === "calendar-events" && !tableEditRow.text) {
        getValidationOverlay(printess, [{ boxIds: [], errorCode: "missingEventText", errorValue1: "" }], "done")
        //alert(printess.gl("ui.eventText"));
        return
      }
      if (p.tableMeta?.tableType === "calendar-events" && p.tableMeta.month && p.tableMeta.year) {
        if ([4, 6, 9, 11].includes(p.tableMeta.month) && (tableEditRow.day > 30 || !Number(tableEditRow.day))) {
          getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "30" }], "done")
          return
        } else if (p.tableMeta.year % 4 === 0 && p.tableMeta.month === 2 && (tableEditRow.day > 29 || !Number(tableEditRow.day))) {
          getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "29" }], "done")
          return
        } else if (p.tableMeta.year % 4 > 0 && p.tableMeta.month === 2 && (tableEditRow.day > 28 || !Number(tableEditRow.day))) {
          getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "28" }], "done")
          return
        } else if (tableEditRow.day < 1 || tableEditRow.day > 31 || !Number(tableEditRow.day)) {
          getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "31" }], "done")
          return
        }
      }

      let data = [];
      try {
        data = JSON.parse(p.value.toString()) || [];
        if (!Array.isArray(data)) {
          data = [];
        }
      } catch (error) {
        data = [];
      }

      if (tableEditRowIndex === -1) {
        data.push(tableEditRow);
      } else {
        data[tableEditRowIndex] = tableEditRow
      }
      p.value = JSON.stringify(data);
      printess.setProperty(p.id, p.value);
      details.innerHTML = "";
    }
    details.appendChild(submitButton);

    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary mb-3 ml-3";
    cancelButton.style.marginLeft = "20px"; // ml-3 does not work ???
    cancelButton.innerText = printess.gl("ui.buttonCancel");
    cancelButton.onclick = () => {
      details.innerHTML = "";
      tableEditRowIndex = -1;
    }
    details.appendChild(cancelButton);

    if (tableEditRowIndex !== -1) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger mb-3 ml-3";
      deleteButton.style.marginLeft = "20px"; // ml-3 does not work ???
      deleteButton.innerText = printess.gl("ui.buttonRemove");
      deleteButton.onclick = () => {
        const data: Array<any> = JSON.parse(p.value.toString()) || [];
        data.splice(tableEditRowIndex, 1);
        p.value = JSON.stringify(data);
        printess.setProperty(p.id, p.value);
        details.innerHTML = "";
      }
      details.appendChild(deleteButton);
    }
    return details;
  }



  function getTableDetailsShortList(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn): HTMLElement {
    const ddContent = document.createElement("div");
    ddContent.className = "dropdown-menu";
    ddContent.setAttribute("aria-labelledby", "defaultDropdown");
    ddContent.style.width = "240px";

    const list = document.createElement("div");
    list.className = "color-picker-drop-down";

    const value = row[col.name];
    for (const f of col.list || []) {
      const a = document.createElement("a");
      a.className = "color-picker-color dropdown-item";
      a.innerText = f.toString();
      if (value == f) {
        a.classList.add("active");
      }
      a.onclick = () => {
        setTableValue(col, f)
        if (col.list) {
          list.querySelectorAll("a").forEach(a => a.classList.remove("active"));
          a.classList.add("active");
        }
      }
      list.appendChild(a);
    }
    return list;
  }


  function getTableDetailsDropDown(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn, asList: boolean, fullWidth: boolean = true): HTMLElement {

    const dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");

    const ddContent = document.createElement("ul");

    const value = row[col.name];
    if (col.list) {
      const selectedItem = col.list.filter(s => s == value)[0] ?? null;
      const button = document.createElement("button");
      button.className = "btn btn-light dropdown-toggle";
      if (fullWidth) {
        button.classList.add("full-width");
      }
      // button.style.display = "flex";
      button.dataset.bsToggle = "dropdown";
      button.dataset.bsAutoClose = "true"
      button.setAttribute("aria-expanded", "false");
      if (selectedItem) {
        button.appendChild(getTableDropdownItemContent(printess, value))
      }
      dropdown.appendChild(button);

      if (asList) {
        ddContent.classList.add("list-group");
      } else {
        ddContent.classList.add("dropdown-menu");
        ddContent.setAttribute("aria-labelledby", "defaultDropdown");
        ddContent.style.width = "100%";
      }
      for (const entry of col.list) {
        const li = document.createElement("li");
        if (asList) {
          li.classList.add("list-group-item");
          if (entry === selectedItem) {
            li.classList.add("active");
          }
        }
        const a = document.createElement("a");
        a.classList.add("dropdown-item");
        a.onclick = () => {
          setTableValue(col, entry);

          if (col.list) {
            button.innerHTML = "";
            button.appendChild(getTableDropdownItemContent(printess, entry));
            if (asList) {
              ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
              li.classList.add("active")
            }
          }
        }
        a.appendChild(getTableDropdownItemContent(printess, entry));
        li.appendChild(a);
        ddContent.appendChild(li)
      }
      dropdown.appendChild(ddContent);
    }
    if (asList) {
      return ddContent;
    } else {
      return addLabel(printess, dropdown, p.id, false, p.kind, col.label || col.name);
    }
  }
  function getTableDropdownItemContent(printess: iPrintessApi, value: string | number): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("dropdown-list-entry");

    const label = document.createElement("div");
    label.classList.add("dropdown-list-label");
    label.innerText = printess.gl(value.toString());
    div.appendChild(label);

    return div;
  }
  function getTableTextBox(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn, forMobile: boolean): HTMLElement {

    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = row[col.name];
    inp.autocomplete = "off";
    inp.autocapitalize = "off";
    inp.spellcheck = false;

    // Key-up does not fire when autocomplete happens
    inp.oninput = () => {
      setTableValue(col, inp.value)
      //todo: add validation
    }

    if (forMobile) {
      inp.classList.add("form-control");
      return inp;
    } else {
      const r = addLabel(printess, inp, p.id, forMobile, p.kind, col.label || col.name);
      return r;
    }
  }

  function setTableValue(col: iExternalTableColumn, newValue: string | number | boolean) {
    tableEditRow[col.name]
    if (col.data === "number" && typeof newValue !== "number") {
      tableEditRow[col.name] = isNaN(+newValue) ? 0 : +newValue;
    } else if (col.data === "boolean" && typeof newValue !== "boolean") {
      tableEditRow[col.name] = !!(newValue);
    } else {
      tableEditRow[col.name] = newValue;
    }
  }






  /*
   *   Mobile UI Buttons
   */
  function getMobileUiDiv(): HTMLDivElement {
    let mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
    if (!mobileUi) {
      mobileUi = document.createElement("div");
      mobileUi.className = "mobile-ui";
      document.body.appendChild(mobileUi);
    }
    return mobileUi;
  }
  /* function getMobileUiDiv(): HTMLDivElement {
     let mobileUiWrapper: HTMLDivElement | null = document.querySelector(".mobile-ui-wrapper");
     let mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
     if (!mobileUi) {
       mobileUiWrapper = document.createElement("div");
       mobileUiWrapper.className = "mobile-ui-wrapper";
       mobileUi = document.createElement("div");
       mobileUi.className = "mobile-ui";
       mobileUiWrapper.appendChild(mobileUi);
       document.body.appendChild(mobileUiWrapper);
     }
     return mobileUi;
   }*/
  function getMobileNavbarDiv(): HTMLElement {
    let mobileNav: HTMLElement | null = document.querySelector(".mobile-navbar");
    if (!mobileNav) {
      mobileNav = document.createElement("nav");
      mobileNav.className = "mobile-navbar bg-primary"
      document.body.appendChild(mobileNav);
    }
    return mobileNav;
  }



  function renderMobileUi(printess: iPrintessApi,
    properties: Array<iExternalProperty> = uih_currentProperties,
    state: MobileUiState = uih_currentState,
    groupSnippets: Array<iExternalSnippetCluster> = uih_currentGroupSnippets,
    layoutSnippets: Array<iExternalSnippetCluster> = uih_currentLayoutSnippets,
    tabs: Array<iExternalTab> = uih_currentTabs,
    skipAutoSelect: boolean = false) {


    uih_currentTabs = tabs;
    uih_currentGroupSnippets = groupSnippets;
    uih_currentLayoutSnippets = layoutSnippets;
    uih_currentState = state;
    uih_currentProperties = properties;
    uih_currentRender = "mobile";

    const mobileUi = getMobileUiDiv();
    mobileUi.innerHTML = "";

    // remove desktop ui if rendered before
    const desktopProperties = document.getElementById("desktop-properties");
    if (desktopProperties) {
      desktopProperties.innerHTML = "";
    }
    const desktopPagebar = document.getElementById("desktop-pagebar");
    if (desktopPagebar) {
      desktopPagebar.innerHTML = "";
    }

    removeDesktopTabsNavigation();

    // remove close-control-host button if existing 
    const closeButton = mobileUi.querySelector(".close-control-host-button");
    if (closeButton) {
      mobileUi.removeChild(closeButton);
    }

    // remove Ui Settings button if existing
    const printessBuyerPropertiesButton = document.getElementById("printessBuyerPropertiesButton");
    if (printessBuyerPropertiesButton) {
      printessBuyerPropertiesButton.style.display = "none";
    }


    if ((printess.spreadCount() > 1 && printess.pageNavigationDisplay() === "numbers") || (printess.pageNavigationDisplay() === "icons")) {
      document.body.classList.add("has-mobile-page-bar");
    } else {
      document.body.classList.remove("has-mobile-page-bar");
    }
    if (printess.pageNavigationDisplay() === "icons") {
      document.body.classList.add("has-mobile-icon-pagebar");
    } else {
      document.body.classList.remove("has-mobile-icon-pagebar");
    }

    // document.documentElement.style.setProperty("--mobile-pagebar-height", "0")

    let autoSelectButton: iMobileUIButton | null = null;
    if (state !== "add") {
      // render properties UI
      const buttons = getMobileButtons(printess, undefined, undefined, skipAutoSelect);
      mobileUi.innerHTML = "";
      mobileUi.appendChild(buttons.div);
      autoSelectButton = buttons.autoSelectButton;
      setPropertyVisibilities(printess)
    }

    const controlHost = document.createElement("div");
    controlHost.className = "mobile-control-host";
    controlHost.id = "mobile-control-host";
    mobileUi.appendChild(controlHost);

    mobileUi.appendChild(getMobilePropertyNavButtons(printess, state, autoSelectButton !== null));

    // update content for mobile properties (fullscreen)
    if (printess.showTabNavigation()) {
      updateMobilePropertiesFullscreen(printess);
    }

    /* if (state === "add") {
      // render list of group snippets
      document.body.classList.add("no-mobile-button-bar");
      renderMobileControlHost(printess, { state: "add" });
    } */

    // translate change Layout button text
    const layoutSnippetAmount = layoutSnippets.map(ls => ls.snippets.length).reduce((prev, curr) => prev + curr, 0);
    const layoutsButton = <HTMLButtonElement>document.querySelector(".show-layouts-button");
    if (layoutsButton && printess.showTabNavigation()) {
      layoutsButton.style.visibility = "hidden";
    } else if (layoutsButton && layoutSnippetAmount > 0) {
      layoutsButton.textContent = printess.gl("ui.changeLayout");
      layoutsButton.style.visibility = "visible";
    }
    const closeLayoutsButton = <HTMLButtonElement>document.getElementById("closeLayoutOffCanvas");
    if (closeLayoutsButton && printess.showTabNavigation()) {
      closeLayoutsButton.click();
    }
    // handle Offcanvas for Layout Snippets
    if (!printess.showTabNavigation() && layoutSnippetAmount > 0) {
      handleOffcanvasLayoutsContainer(printess, true);
    }

    // add editable frames hint to session storage if frame has been selected
    if (printess.hasSelection()) {
      setStorageItemSafe("editableFrames", "hint closed");
      const framePulse = document.getElementById("frame-pulse");
      if (framePulse) framePulse.parentElement?.removeChild(framePulse);
    }

    // render mobile ui hints
    renderUiButtonHints(printess, mobileUi, state, true);
    renderEditableFramesHint(printess);

    // open dialog with layout snippets
    if (!uih_layoutSelectionDialogHasBeenRendered && layoutSnippetAmount > 0 && printess.showLayoutsDialog()) {
      uih_layoutSelectionDialogHasBeenRendered = true;
      renderLayoutSelectionDialog(printess, layoutSnippets, true);
    }

    // attach/remove shadow pulse animation to/from "change layout" button
    if (state === "document" && printess.hasLayoutSnippets() && !getStorageItemSafe("changeLayout")) {
      toggleChangeLayoutButtonHint();
    }

    // Buttons for "add" & "previous/next step" & "basket" & "done"
    const hasGroupSnippets = groupSnippets.length > 0;
    const hastLayoutSnippets = layoutSnippetAmount > 0 && printess.showTabNavigation();
    const showPhotoTab = !hasGroupSnippets && !hastLayoutSnippets && printess.showPhotoTab() && printess.showTabNavigation();
    if (showPhotoTab) {
      uih_currentTabId = "#PHOTOS";
    }
    if ((hasGroupSnippets || hastLayoutSnippets || showPhotoTab) && state !== "add") {
      mobileUi.appendChild(getMobilePlusButton(printess));
    }
    if (state !== "document") {
      mobileUi.appendChild(getMobilePropertyNavButtons(printess, state, false)); // double rendering because of call when loading mobileUi ???
    } else {
      // propably we where in text edit and now need to wait for viewport scroll evevnt to fire 
      // to not resize twice 
      // if (window.visualViewport && window.visualViewport.offsetTop) {
      if (uih_viewportOffsetTop) {
        return;
      }
      if (autoSelectButton) {
        if (uih_lastMobileState?.externalProperty?.kind === "selection-text-style") {
          if (properties.length && properties[0].kind === "selection-text-style") {
            // this is supposedly an update call while we are in text mode
            // skip resize and wait for auto-select of proper button
            if (autoSelectButton.newState?.metaProperty && autoSelectButton.newState.metaProperty === uih_lastMobileState?.metaProperty) { //} .externalProperty?.kind === "selection-text-style") {
              return;
            }
          }
        }
      }

    }
    // const inTextStyle = (properties.length && properties[0].kind === "selection-text-style");

    // set Zoom Mode to frame if state is text to zoom into text box when error message is "missing text"
    printess.setZoomMode(printess.isTextEditorOpen() || state === "text" ? "frame" : "spread");
    resizeMobileUi(printess);
  }

  // attach/remove shadow pulse animation to/from "change layout" button
  function toggleChangeLayoutButtonHint(): void {
    const layoutsButton = <HTMLButtonElement>document.querySelector(".show-layouts-button");
    if (layoutsButton) {
      layoutsButton.classList.add("layouts-button-pulse");

      layoutsButton.onclick = (e: MouseEvent) => {
        e.preventDefault();
        // remove ui hint for "change layout" after clicking the "change layout" button
        const uiHintAlert = <HTMLDivElement>document.getElementById("ui-hint-changeLayout");
        uiHintAlert?.parentElement?.removeChild(uiHintAlert);
        // remove shadow pulse animation after button has been clicked
        layoutsButton.classList.remove("layouts-button-pulse");
        setStorageItemSafe("changeLayout", "hint closed");
        layoutsButton.onclick = null;
      }
    }
  }

  // render ui hint for editable frames
  let renderEditableFramesHintTimer: number = 0;
  function renderEditableFramesHint(printess: iPrintessApi): void {
    const showEditableFramesHint = false; // printess.uiHintsDisplay().includes("editableFrames") && !getStorageItemSafe("editableFrames");
    if (showEditableFramesHint) {
      renderEditableFramesHintTimer = window.setTimeout(() => {
        renderEditableFramesHintTimer = 0;
        printess.getFrameUiHintPosition().then((frame) => {
          const spread = document.querySelector("div.printess-content");
          let pulseDiv = document.getElementById("frame-pulse");
          if (!pulseDiv) {
            pulseDiv = document.createElement("div") //printess.getIcon("bullseye-pointer-solid");
            pulseDiv.classList.add("frame-hint-pulse");
            pulseDiv.id = "frame-pulse";
            pulseDiv.style.position = "absolute";
          }
          pulseDiv.style.left = frame.left;
          pulseDiv.style.top = frame.top;

          const pointer = printess.getIcon("hand-pointer-light");
          pointer.classList.add("frame-hint-pointer");

          pulseDiv.appendChild(pointer);
          spread?.appendChild(pulseDiv);
        })
      }, 1000);
    }
  }

  // render ui hints for mobile-property-plus-button ("add-design") & change-layout button
  function renderUiButtonHints(printess: iPrintessApi, container: HTMLElement, state: MobileUiState = uih_currentState, forMobile: boolean): void {
    const showLayoutsHint = printess.showTabNavigation() && forMobile || !printess.showTabNavigation();

    const uiHints = [{
      header: "expertMode",
      msg: printess.gl("ui.expertModeHint"),
      position: "fixed",
      top: !forMobile && printess.pageNavigationDisplay() === "icons" ? "50px" : "calc(var(--editor-pagebar-height) + 5px)",
      left: !forMobile && printess.pageNavigationDisplay() === "icons" ? "calc(100% - 450px)" : "30px",
      color: "danger",
      show: printess.uiHintsDisplay().includes("expertMode") && !getStorageItemSafe("expertMode") && printess.hasExpertButton(),
      task: () => {
        const expertBtn = document.getElementById("printess-expert-button");
        if (expertBtn) {
          if (forMobile) {
            expertBtn.classList.add("btn-light");
            expertBtn.classList.remove("btn-outline-light");
          } else {
            expertBtn.classList.add("btn-primary");
            expertBtn.classList.remove("btn-outline-primary");
          }
        }
        printess.enterExpertMode();
      }
    }, {
      header: "addDesign",
      msg: printess.showTabNavigation() ? printess.gl("ui.addDesignLayoutHint") : printess.gl("ui.addDesignHint"),
      position: "absolute",
      top: printess.showTabNavigation() ? "-170px" : "-150px",
      left: "30px",
      color: "success",
      show: printess.uiHintsDisplay().includes("groupSnippets") && !getStorageItemSafe("addDesign") && uih_currentGroupSnippets.length > 0 && forMobile,
      task: () => {
        setStorageItemSafe("addDesign", "hint closed");
        renderMobilePropertiesFullscreen(printess, "add-design", "open");
      }
    }, {
      header: "changeLayout",
      msg: printess.gl("ui.changeLayoutHint"),
      position: "fixed",
      top: printess.hasExpertButton() && forMobile ? "calc(50% - 100px)" : "calc(50% - 150px)",
      left: "55px",
      color: "primary",
      show: printess.uiHintsDisplay().includes("layoutSnippets") && !getStorageItemSafe("changeLayout") && printess.hasLayoutSnippets() && showLayoutsHint && !forMobile,
      task: () => {
        const layoutBtn: HTMLButtonElement | null = document.querySelector(".show-layouts-button");
        if (layoutBtn) {
          layoutBtn.classList.remove("layouts-button-pulse");
        }
        const offCanvas: HTMLDivElement | null = document.querySelector("div#layoutOffcanvas");
        if (offCanvas) {
          offCanvas.style.visibility = "visible";
          offCanvas.classList.add("show");
        }
        const offCanvasButton: HTMLButtonElement | null = document.querySelector("button#closeLayoutOffCanvas");
        if (offCanvasButton && offCanvas) {
          offCanvasButton.onclick = () => offCanvas.classList.remove("show");
        }
      }
    }];

    const expertAlert = document.getElementById("ui-hint-expertMode");
    if (!printess.hasExpertButton() && expertAlert) {
      expertAlert.remove();
    }
    const layoutsButton = <HTMLButtonElement>document.querySelector("button.show-layouts-button");
    const layoutAlert = document.getElementById("ui-hint-changeLayout");
    if ((layoutsButton.style.visibility === "hidden" || !layoutsButton) && layoutAlert) {
      layoutAlert.remove();
    }

    uiHints.filter(h => h.show).forEach(hint => {
      let alert: HTMLElement | null = document.getElementById("ui-hint-" + hint.header);

      if (alert) {
        // alert displayed already
      } else {
        alert = document.createElement("div");
        const color = hint.color;
        alert.className = "alert alert-dismissible fade show ui-hint-alert";
        alert.id = "ui-hint-" + hint.header;
        alert.classList.add("alert-" + color);
        alert.style.position = hint.position;
        alert.style.left = hint.left;
        alert.style.top = hint.top;

        const title = document.createElement("strong");
        title.style.paddingRight = "5px";
        title.textContent = printess.gl("ui." + hint.header);

        const text = document.createElement("div");
        text.textContent = hint.msg;

        const close = printess.getIcon("close");
        close.classList.add("close-info-alert-icon");
        close.onclick = () => {
          setStorageItemSafe(hint.header, "hint closed");
          alert?.parentElement?.removeChild(alert);
          if (hint.header === "changeLayout") {
            const layoutsButton = <HTMLButtonElement>document.querySelector(".show-layouts-button");
            if (layoutsButton) {
              layoutsButton.onclick = (e: MouseEvent) => {
                e.preventDefault();
                layoutsButton.classList.remove("layouts-button-pulse");
                layoutsButton.onclick = null;
              }
            }
          }
        }

        const flexWrapper = document.createElement("div");
        flexWrapper.className = "d-flex w-100 justify-content-end mt-1";
        const open = document.createElement("span");
        open.className = "layout-hint-open";
        open.textContent = hint.header === "expertMode" ? printess.gl("ui.turnOn") : printess.gl("ui.showMe");
        open.onclick = () => {
          setStorageItemSafe(hint.header, "hint closed");
          alert?.parentElement?.removeChild(alert);
          hint.task();
        }
        flexWrapper.appendChild(open);

        alert.appendChild(title);
        alert.appendChild(text);
        alert.appendChild(close);
        alert.appendChild(flexWrapper);

        container.appendChild(alert);
      }
    });
  }

  function getMobilePlusButton(printess: iPrintessApi): HTMLDivElement {
    const button = document.createElement("div");
    button.className = "mobile-property-plus-button";

    const circle = document.createElement("div");
    circle.className = "mobile-property-circle";
    circle.onclick = () => {
      setStorageItemSafe("addDesign", "hint closed");
      //renderMobileUi(printess, undefined, "add", undefined);
      renderMobilePropertiesFullscreen(printess, "add-design", "open");
    }

    if (!getStorageItemSafe("addDesign")) {
      circle.classList.add("mobile-property-plus-pulse");
    } else {
      circle.classList.remove("mobile-property-plus-pulse");
    }
    const ico = <iconName>printess.gl("ui.addDesignIcon") || "plus";
    const icon = printess.getIcon(ico);
    circle.appendChild(icon);

    button.appendChild(circle);
    return button;
  }

  // button for mobile property navigation
  function getMobileNavButton(btn: { name: string; icon: SVGElement; task: (() => void) | (() => Promise<void>) }, circleWhiteBg: boolean): HTMLDivElement {
    const button = document.createElement("div");
    button.className = "mobile-property-nav-button";

    const circle = document.createElement("div");
    circle.className = "mobile-property-circle bg-primary text-white"
    circle.onclick = () => btn.task();
    if (circleWhiteBg) {
      circle.className = "mobile-property-circle bg-white text-primary border border-primary";
    }

    circle.appendChild(btn.icon);
    button.appendChild(circle);

    return button;
  }

  // render mobile buttons to navigate through properties
  function getMobilePropertyNavButtons(printess: iPrintessApi, state: MobileUiState, fromAutoSelect: boolean, hasControlHost: boolean = false): HTMLElement {
    let container = document.getElementById("mobile-nav-buttons-container");
    if (container) {
      container.innerHTML = "";
    } else {
      container = document.createElement("div");
      container.id = "mobile-nav-buttons-container";
      container.className = "mobile-property-button-container";
    }

    const iconName = <iconName>printess.gl("ui.buttonBasketIcon") || "shopping-cart-add";
    const basketIcon = printess.getIcon(iconName);

    const buttons = {
      add: {
        name: "closeNewSnippetList",
        icon: printess.getIcon("carret-down-solid"),
        task: () => { printess.clearSelection(); resizeMobileUi(printess) }
      },
      previous: {
        name: "previous",
        icon: printess.getIcon("arrow-left"),
        task: () => {
          printess.previousStep();
          getCurrentTab(printess, (Number(printess.getStep()?.index) - 1), true);
        }
      },
      clear: {
        name: "clear",
        icon: printess.getIcon("check"),
        task: () => { printess.clearSelection(); resizeMobileUi(printess) }
      },
      frame: {
        name: "frame", /* avoids auto selection on click */
        icon: printess.getIcon("check"),
        task: () => { printess.setZoomMode("spread"); renderMobileUi(printess, uih_currentProperties, "frames", undefined, undefined, undefined, true) }
      },
      document: {
        name: "document", /* avoids auto selection on click */
        icon: printess.getIcon("check"),
        task: () => renderMobileUi(printess, uih_currentProperties, "document", undefined, undefined, undefined, true)
      },
      next: {
        name: "next",
        icon: printess.getIcon("arrow-right"),
        task: async () => {
          await gotoNextStep(printess);
          getCurrentTab(printess, (Number(printess.getStep()?.index) + 1), true);
        }
      },
      basket: {
        name: "basket",
        icon: basketIcon,
        task: () => addToBasket(printess)
      }
    }

    if (state === "add") {
      // Close ControlHost Button
      const add = getMobileNavButton(buttons.add, printess.hasSteps());
      add.classList.add("close-designs-button")
      container.appendChild(add);

      /*  } else if (state === "details" && (uih_currentProperties.length > 1 || !printess.buyerCanHaveEmptySelection())) {
          container.appendChild(getMobileNavButton(buttons.frame, printess.hasSteps()));
    
          // Basket / Next button
          if (printess.getStep() && !printess.hasNextStep()) {
            container.appendChild(getMobileNavButton(buttons.basket, false));
          } else if (printess.hasNextStep()) {
            container.appendChild(getMobileNavButton(buttons.next, false));
          }
    */


    } else if (state === "text") {
      container.appendChild(getMobileNavButton(buttons.clear, false));

    } else if (state === "details" || state === "frames") {
      // OK / Previous button


      // do we need a checker or a previous button? 
      if (printess.isCurrentStepActive()) {

        if (uih_currentProperties.length > 1 && state === "details") {
          container.appendChild(getMobileNavButton(buttons.frame, true));
        } else if (printess.hasPreviousStep()) {
          container.appendChild(getMobileNavButton(buttons.previous, false));
        }

      } else {

        if ((printess.buyerCanHaveEmptySelection() && printess.hasSelection()) || (printess.hasBackground() && printess.hasSelection())) {
          if (uih_currentProperties.length > 1 && state === "details") {
            // show mobile buttons if more than one property
            container.appendChild(getMobileNavButton(buttons.frame, printess.hasSteps()))
          } else {
            // render clear button only if there is something to clear
            container.appendChild(getMobileNavButton(buttons.clear, printess.hasSteps()));
          }
        } else if (printess.hasPreviousStep()) {
          container.appendChild(getMobileNavButton(buttons.previous, false));
        }

      }

      // Basket / Next button -> show basket here only in step mode
      if (printess.hasSteps()) {
        if (printess.hasNextStep()) {
          container.appendChild(getMobileNavButton(buttons.next, false));
        } else {
          container.appendChild(getMobileNavButton(buttons.basket, false));
        }
      }

    } else if (state === "document") {
      //else (DOCUMENT)
      // 	if (NOT HAS BUTTONS) (is false with just a single text) 
      //     -PREVIOUS / NEXT  
      //    // ok macht keinen sinn, da wieder das gleiche angezeigt wird 
      //  else if (has CONTROL-HOST) 
      //    - NEXT
      //    if (EMPTY) 
      //      - OK -> CLEAR selection -> DOCUMENT
      //    else
      //      - PREVIOUS
      //  else 
      //    - PREVIOUS / NEXT


      // Basket / Next button -> show basket here only in step mode
      if (printess.hasSteps()) {
        if (printess.hasPreviousStep()) {
          container.appendChild(getMobileNavButton(buttons.previous, false));
        }

        if (printess.hasNextStep()) {
          container.appendChild(getMobileNavButton(buttons.next, false));
        } else {
          container.appendChild(getMobileNavButton(buttons.basket, false));
        }
      }

      return container;

      /*
      if (!printess.hasSteps() && !hasControlHost && uih_currentProperties.length <= 1) {
        return container;
      }

      // check if we have a root-form-field in auto-select mode or we have an active control host 
      if (printess.getStep() === null && (fromAutoSelect || hasControlHost)) {
        // ok button, to zoom back to close control-host and zoom to entire stage 
        // is actually only needed if zoom to frame is on. 
        container.appendChild(getMobileNavButton(buttons.document, false));

      } else {
        // Previous button
        if (printess.hasPreviousStep()) {
          container.appendChild(getMobileNavButton(buttons.previous, false));
        }
        // } else if (printess.getZoomMode() === "frame") {
        // } else if (uih_currentProperties.length > 1) {
        // be able to got back to all root-buttons
        // container.appendChild(getMobileNavButton(buttons.frame, false));
        //  }
      }

      // Next button
      if (printess.hasNextStep()) {
        container.appendChild(getMobileNavButton(buttons.next, false));
      } else if (printess.hasSteps() && printess.hasPreviousStep()) {
        container.appendChild(getMobileNavButton(buttons.basket, false));
      }*/
    }

    return container;
  }

  function renderMobileNavBar(printess: iPrintessApi) {

    const navBar = getMobileNavbarDiv();
    navBar.innerHTML = "";
    const nav = document.createElement("div");
    nav.className = "navbar navbar-dark";
    nav.style.flexWrap = "nowrap";


    const basketBtnBehaviour = printess.getBasketButtonBehaviour();

    const hasSteps = printess.hasSteps();
    const isDocTabs = printess.pageNavigationDisplay() === "doc-tabs";
    const isBookMode = printess.canAddSpreads() || printess.canRemoveSpreads();
    const noStepsMenu = printess.showUndoRedo() && !hasSteps && (printess.hasExpertButton() || printess.showSaveButton()) && (basketBtnBehaviour === "go-to-preview" || isBookMode > 0 || isDocTabs);
    const showUndoRedo = printess.showUndoRedo() && !hasSteps && !printess.hasPreviewBackButton() && !isDocTabs;
    const noCloseBtn = hasSteps || (isDocTabs && printess.showUndoRedo());
    const showExpertBtn = printess.hasExpertButton() && !noStepsMenu && !hasSteps && !printess.showSaveButton();
    const showExpertBtnWithSteps = printess.hasExpertButton() && hasSteps && printess.stepHeaderDisplay() === "never" && !printess.showSaveButton();
    const showSaveBtn = printess.showSaveButton() && !noStepsMenu && !hasSteps && !printess.hasExpertButton();
    const showSaveBtnWithSteps = printess.showSaveButton() && hasSteps && printess.stepHeaderDisplay() === "never" && !printess.hasExpertButton();


    // Back Button 
    {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm ms-2 me-2 main-button";
      btn.style.minWidth = "40px";

      const container = document.createElement("div");
      container.className = "d-flex";

      if (printess.hasPreviewBackButton()) {
        const btn = document.createElement("button");
        btn.className = "btn btn-sm text-white me-2 ms-2";
        const ico = printess.getIcon("arrow-left");
        ico.classList.add("icon");
        btn.appendChild(ico);
        btn.onclick = () => printess.gotoPreviousPreviewDocument();
        nav.appendChild(btn);
      } else {
        if (!noStepsMenu && !noCloseBtn) {
          const callback = printess.getBackButtonCallback();

          btn.className = "btn btn-sm text-white me-2 ms-2"; // border border-white";
          btn.textContent = printess.gl("ui.buttonBack");

          const caption = printess.gl("ui.buttonBack");
          const icon = <iconName>printess.gl("ui.buttonBackIcon");
          if (icon) {
            const svg = printess.getIcon(icon);
            svg.style.fill = "var(--bs-light)";
            svg.style.height = "24px";
            if (caption) {
              svg.style.float = "left";
              svg.style.marginRight = "10px";
            }

            btn.appendChild(svg);
          }

          if (!callback) btn.classList.add("disabled");

          btn.onclick = () => {
            if (printess.isInDesignerMode()) {
              if (callback) {
                handleBackButtonCallback(printess, callback);
              }
            } else {
              getCloseEditorDialog(printess);
            }
          }
        } else {
          const ico = printess.getIcon("burger-menu");
          ico.classList.add("icon");
          btn.appendChild(ico);

          let showMenuList = false;

          btn.onclick = () => {
            showMenuList = !showMenuList;
            const menuList = document.getElementById("mobile-menu-list");
            if (menuList) navBar.removeChild(menuList);

            if (showMenuList) navBar.appendChild(getMobileMenuList(printess));
          }
        }

        if (showExpertBtn || showExpertBtnWithSteps) {
          const expertBtn = getExpertModeButton(printess, true);

          container.appendChild(btn);
          container.appendChild(expertBtn);

          nav.appendChild(container);
        } else if (showSaveBtn || showSaveBtnWithSteps) {
          const saveBtn = getSaveButton(printess, true);

          container.appendChild(btn);
          container.appendChild(saveBtn);

          nav.appendChild(container);
        } else {
          nav.appendChild(btn);
        }
      }
    }


    if (hasSteps) {

      // *********** Mobile Steps bar 
      const s = printess.getStep();
      const hd = printess.stepHeaderDisplay();
      if (s && hd !== "never") { // && printess.isCurrentStepActive()) {
        const step = document.createElement("div");
        step.style.flexGrow = "1";
        step.style.display = "flex";
        step.style.alignItems = "center";
        step.style.justifyContent = "center";
        document.body.classList.add("mobile-has-steps-header");


        if (hd === "only badge" || hd === "title and badge") {
          const badge = document.createElement("div");
          badge.className = "step-badge step-badge-sm";
          badge.innerText = (s.index + 1).toString();
          step.appendChild(badge);
        }
        if (hd === "only title" || hd === "title and badge") {
          const h6 = document.createElement("h6");
          h6.innerText = printess.gl(s.title);
          h6.style.margin = "0";
          h6.className = "text-light text-truncate";
          h6.style.maxWidth = "calc(100vw - 150px)";
          step.appendChild(h6)
        }
        if (hd === "tabs list" || hd === "badge list") {
          if (hd === "badge list") {
            step.classList.add("badge-list-mobile");
          }
          step.classList.add("step-tabs-list");
          step.id = "step-tab-list";
          step.appendChild(getStepsTabsList(printess, true, hd)); // placeholder right align of buttons

          const scrollRight = document.createElement("div");
          scrollRight.className = "scroll-right-indicator";
          scrollRight.style.backgroundImage = "linear-gradient(to right, rgba(168,168,168,0), var(--bs-primary))";
          scrollRight.style.display = "inline-block";
          step.appendChild(scrollRight);
        }
        /* if (hd === "badge list") {
          step.classList.add("active-step-badge-list");
          step.classList.add("overflow-auto");
          step.style.justifyContent = "flex-start";
          step.appendChild(getStepsBadgeList(printess, true)); // placeholder right align of buttons
        } */
        nav.appendChild(step);
      } else {
        document.body.classList.remove("mobile-has-steps-header");
      }
    } else if (isDocTabs) {
      const docTabs = document.createElement("div");
      docTabs.style.flexGrow = "1";
      docTabs.style.display = "flex";
      docTabs.style.alignItems = "center";
      docTabs.style.justifyContent = "center";
      docTabs.classList.add("step-tabs-list");
      docTabs.id = "step-tab-list";

      document.body.classList.add("mobile-has-steps-header");

      const scrollRight = document.createElement("div");
      scrollRight.className = "scroll-right-indicator";
      scrollRight.style.backgroundImage = "linear-gradient(to right, rgba(168,168,168,0), var(--bs-primary))";
      scrollRight.style.display = "inline-block";

      docTabs.appendChild(getStepsTabsList(printess, true, "doc tabs"));
      docTabs.appendChild(scrollRight);

      nav.appendChild(docTabs);

      if (printess.hasPreviewBackButton()) {
        docTabs.style.visibility = "hidden";
      }

    } else if (showUndoRedo) {

      // UNDO-REDO-BUTTONS
      const undoredo = document.createElement("div");
      undoredo.style.display = "flex";
      {
        const btn = document.createElement("button");
        btn.className = "btn btn-sm";
        const ico = printess.getIcon("undo-arrow");
        ico.classList.add("icon");
        btn.onclick = () => {
          printess.undo();
        }
        btn.appendChild(ico);
        undoredo.appendChild(btn);
      }
      {
        const btn = document.createElement("button");
        btn.classList.add("btn");
        btn.classList.add("btn-sm");
        const ico = printess.getIcon("redo-arrow");
        ico.classList.add("icon");
        btn.onclick = () => {
          printess.redo();
        }
        btn.appendChild(ico);
        undoredo.appendChild(btn);
      }
      nav.appendChild(undoredo);
    }

    // wrap PREVIOUS PREVIEW DOC BUTTON and NEXT BUTTON to keep then right aligned
    const wrapper = document.createElement("div");
    wrapper.className = "d-flex";

    // PREVIOUS PREVIEW DOC BUTTON
    // Only visible in non-step mode to get back from preview to primary 
    /* if (printess.hasPreviewBackButton()) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm ms-2 main-button";
      const ico = printess.getIcon("arrow-left");
      ico.classList.add("icon");
      btn.appendChild(ico);
      btn.onclick = () => printess.gotoPreviousPreviewDocument();
      wrapper.appendChild(btn);
    } else  */
    const isStepTabsList = printess.stepHeaderDisplay() === "tabs list";
    const isStepBadgeList = printess.stepHeaderDisplay() === "badge list";

    if (basketBtnBehaviour === "go-to-preview" && !isStepTabsList && !isStepBadgeList) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm ms-2 main-button";
      btn.classList.add("btn-outline-light");
      btn.innerText = printess.gl("ui.buttonPreview");

      btn.onclick = async () => {
        const validation = await validateAllInputs(printess, "preview");
        if (validation) {
          printess.gotoNextPreviewDocument();
        }
      }
      wrapper.appendChild(btn);
    }

    // NEXT BUTON
    {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm ms-2 me-2 main-button";
      if (printess.hasSteps() && !printess.hasNextStep()) {
        btn.classList.add("main-button-pulse");
      }

      const caption = printess.gl("ui.buttonBasketMobile");

      if (caption) {
        btn.textContent = caption;
        btn.style.color = "white";
        btn.style.whiteSpace = "nowrap";
        btn.style.border = "1px solid var(--bs-light)";
      } else {
        const icon = <iconName>printess.gl("ui.buttonBasketIcon") || "shopping-cart-add";
        const ico = printess.getIcon(icon);
        ico.classList.add("big-icon");
        ico.style.fill = "var(--bs-light)";
        btn.appendChild(ico);
      }


      btn.onclick = () => addToBasket(printess);
      wrapper.appendChild(btn);
    }

    nav.appendChild(wrapper);
    navBar.appendChild(nav);

    /* // *********** Mobile Steps bar 
    const s = printess.getStep();
    const hd = printess.stepHeaderDisplay();
    if (s && printess.isCurrentStepActive() && hd !== "never") {
      nav = document.createElement("div");
      nav.className = "mobile-step-bar"
  
      const step = document.createElement("div");
      step.style.flexGrow = "1";
      step.style.display = "flex";
      step.style.alignItems = "center";
      step.style.justifyContent = "center";
      document.body.classList.add("mobile-has-steps-header");
  
  
      if (hd === "only badge" || hd === "title and badge") {
        const badge = document.createElement("div");
        badge.className = "step-badge step-badge-sm";
        badge.innerText = (s.index + 1).toString();
        step.appendChild(badge);
      }
      if (hd === "only title" || hd === "title and badge") {
        const h6 = document.createElement("h6");
        h6.innerText = printess.gl(s.title);
        h6.style.margin = "0";
        h6.className = "text-light";
        step.appendChild(h6)
      }
      if (hd === "badge list") {
        step.classList.add("active-step-badge-list");
        step.appendChild(getStepsBadgeList(printess, true)); // placeholder right align of buttons
  
      }
      nav.appendChild(step);
      navBar.appendChild(step);
    } else {
      document.body.classList.remove("mobile-has-steps-header");
    } */

    return navBar;
  }

  function getMobileMenuList(printess: iPrintessApi): HTMLDivElement {
    const isBookMode = printess.canAddSpreads() || printess.canRemoveSpreads();
    const isDocTabs = printess.pageNavigationDisplay() === "doc-tabs";
    const noStepsMenu = printess.showUndoRedo() && !printess.hasSteps() && (printess.hasExpertButton() || printess.showSaveButton()) && (printess.getBasketButtonBehaviour() === "go-to-preview" || isBookMode > 0 || isDocTabs);
    const listWrapper = document.createElement("div");
    listWrapper.id = "mobile-menu-list";
    const menuList = document.createElement("div");
    menuList.className = "btn-group w-100 d-flex flex-wrap bg-primary";
    menuList.style.position = "absolute";
    menuList.style.top = "48px";
    menuList.style.left = "0px";
    menuList.style.zIndex = "1000";
    const addSpreads = printess.canAddSpreads();

    const menuItems: Array<MobileUiMenuItems> = [
      {
        id: "back",
        title: "ui.mobileMenuBack",
        icon: "back",
        disabled: !printess.getBackButtonCallback(),
        show: true,
        task: () => {
          if (printess.isInDesignerMode()) {
            const callback = printess.getBackButtonCallback();
            if (callback) {
              handleBackButtonCallback(printess, callback);
            }
          } else {
            getCloseEditorDialog(printess);
          }
        }
      }, {
        id: "save",
        title: "ui.mobileMenuSave",
        icon: "cloud-upload-light",
        show: (printess.showSaveButton() && printess.hasSteps() && printess.stepHeaderDisplay() !== "never") || (noStepsMenu && printess.showSaveButton()),
        disabled: false,
        task: () => {
          saveTemplate(printess, "save");
        }
      }, {
        id: "expert",
        title: "ui.expertMode",
        icon: "pen-swirl",
        show: (printess.hasExpertButton() && printess.hasSteps() && printess.stepHeaderDisplay() !== "never") || (noStepsMenu && printess.hasExpertButton()),
        disabled: false,
        task: () => {
          if (printess.isInExpertMode()) {
            printess.leaveExpertMode();
          } else {
            printess.enterExpertMode();
          }
        }
      }, {
        id: "undo",
        title: "ui.undo",
        icon: "undo-arrow",
        disabled: printess.undoCount() === 0,
        show: printess.showUndoRedo(),
        task: printess.undo
      }, {
        id: "redo",
        title: "ui.redo",
        icon: "redo-arrow",
        show: printess.showUndoRedo(),
        disabled: printess.redoCount() === 0,
        task: printess.redo
      }, {
        id: "addPages",
        title: "+" + (addSpreads * 2) + " " + printess.gl("ui.pages"),
        show: addSpreads > 0,
        disabled: addSpreads === 0,
        task: printess.addSpreads
      }, {
        id: "arrangePages",
        title: printess.gl("ui.arrangePages"),
        show: isBookMode > 0,
        disabled: false,
        task: () => getArrangePagesOverlay(printess, true)
      }, {
        id: "previous",
        title: "ui.buttonPrevStep",
        icon: "arrow-left",
        disabled: !printess.hasPreviousStep(),
        show: printess.hasSteps(),
        task: () => {
          printess.previousStep();
          if ((printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "badge list")) {
            const tabsListScrollbar = <HTMLDivElement>document.getElementById("tabs-list-scrollbar");
            const curStepTab = <HTMLElement>document.getElementById("tab-step-" + (Number(printess.getStep()?.index) - 1));
            setTabScrollPosition(tabsListScrollbar, curStepTab, true);
          }
        }
      }, {
        id: "next",
        title: "ui.buttonNext",
        icon: "arrow-right",
        disabled: !printess.hasNextStep(),
        show: printess.hasSteps(),
        task: async () => {
          await gotoNextStep(printess);
          getCurrentTab(printess, (Number(printess.getStep()?.index) + 1), true);
        }
      }, {
        id: "firstStep",
        title: "ui.buttonFirstStep",
        icon: printess.previewStepsCount() > 0 ? "primary" : "angle-double-left",
        disabled: !printess.hasSteps() || !printess.hasPreviousStep(),
        show: printess.hasSteps(),
        task: () => {
          printess.gotoFirstStep();
          getCurrentTab(printess, 0, true);
        }
      }, {
        id: "lastStep",
        title: printess.previewStepsCount() > 0 ? "ui.buttonPreview" : "ui.buttonLastStep",
        icon: printess.previewStepsCount() > 0 ? "preview-doc" : "angle-double-right",
        disabled: !printess.hasNextStep(),
        show: printess.hasSteps(),
        task: async () => {
          const validation = await validateAllInputs(printess, printess.previewStepsCount() > 0 ? "preview" : "validateAll");
          if (validation) {
            if (printess.previewStepsCount() > 0) {
              printess.gotoPreviewStep();
            } else {
              printess.gotoLastStep();
              getCurrentTab(printess, printess.lastStep()?.index ?? 0, true);
            }
          }
        }
      }
    ];

    menuItems.forEach((mi, idx) => {
      if (mi.show) {
        const hasExpertButton = printess.hasExpertButton() && printess.hasSteps() && printess.stepHeaderDisplay() !== "never";
        const item = document.createElement("li");
        item.className = "btn btn-primary d-flex w-25 justify-content-center align-items-center";
        if (mi.disabled) item.classList.add("disabled");
        if (mi.id === "next" || (printess.previewStepsCount() === 0 && mi.id === "lastStep")) {
          item.classList.add("reverse-menu-btn-content");
        }
        item.style.border = "1px solid rgba(0,0,0,.125)";
        if (hasExpertButton || noStepsMenu || printess.showSaveButton()) {
          item.style.minWidth = "50%";
        } else {
          if (idx < 4) item.style.minWidth = "33%";
          if (idx >= 4) item.style.minWidth = "50%";
        }

        if (printess.isInExpertMode() && mi.id === "expert") {
          item.classList.remove("btn-primary");
          item.classList.add("btn-light");
        }

        if (mi.id === "back" && !printess.showUndoRedo() && !hasExpertButton && !noStepsMenu && !printess.showSaveButton()) {
          item.style.minWidth = "100%";
        }

        const span = document.createElement("span");
        span.textContent = printess.gl(mi.title);

        if (printess.hasExpertButton() && printess.showSaveButton()) {
          if (idx < 4) item.style.minWidth = "33%";
          if (mi.id === "expert") {
            span.textContent = "Expert";
          }
        }

        if (mi.icon) {
          const icon = printess.getIcon(mi.icon);
          icon.style.width = "20px";
          icon.style.height = "20px";
          icon.style.marginRight = "10px";

          if (mi.id === "next" || (printess.previewStepsCount() === 0 && mi.id === "lastStep")) {
            icon.style.marginLeft = "10px";
            icon.style.marginRight = "0px";
          }

          item.appendChild(icon);
        }

        item.appendChild(span);

        item.onclick = () => {
          const list = document.getElementById("mobile-menu-list");
          if (list) list.parentElement?.removeChild(list);
          mi.task();
        }

        menuList.appendChild(item);
      }
    });

    listWrapper.appendChild(menuList);

    return listWrapper;
  }



  function getMobilePageBarDiv(): HTMLDivElement {
    let pagebar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
    if (!pagebar) {
      pagebar = document.createElement("div");
      pagebar.className = "mobile-pagebar";
      document.body.appendChild(pagebar);
    } else {
      pagebar.innerHTML = "";
    }
    return pagebar;
  }

  function getMobilePriceBarDiv(printess: iPrintessApi): void {
    let pricebar: HTMLDivElement | null = document.querySelector(".mobile-pricebar");

    if (!pricebar) {
      pricebar = document.createElement("div");
      pricebar.className = "mobile-pricebar";
      document.body.appendChild(pricebar);
    } else {
      pricebar.innerHTML = "";
    }

    const priceDiv = document.createElement("div");
    priceDiv.className = "total-price-container";
    priceDiv.id = "total-price-display";
    pricebar.appendChild(priceDiv);

    const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
    let mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");

    if (printess.pageNavigationDisplay() === "icons") {
      mobilePageBarHeight = 100;
    }

    if (pricebar && uih_mobilePriceDisplay !== "closed") {
      pricebar.style.top = mobileNavBarHeight + mobilePageBarHeight + "px";
    }

    getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay, true);

    let opener: HTMLDivElement | null = document.querySelector(".mobile-price-display-opener");
    if (!opener) {
      opener = document.createElement("div");
      opener.className = "mobile-price-display-opener";
      const openIco = printess.getIcon("grid-lines");
      openIco.classList.add("open-icon");
      opener.appendChild(openIco);
      document.body.appendChild(opener);
    }
    if (uih_mobilePriceDisplay === "open" || uih_mobilePriceDisplay === "none") {
      opener.classList.add("hidden");
    } else {
      opener.classList.remove("hidden");
    }

    const closer = document.createElement("div");
    closer.className = "price-display-side-closer";
    const closeIco = printess.getIcon("close");
    closeIco.classList.add("close-icon")
    closer.appendChild(closeIco);

    closer.ontouchstart = () => {
      opener?.classList.remove("hidden");
      if (pricebar) pricebar.classList.add("closed");
      uih_mobilePriceDisplay = "closed";
      resizeMobileUi(printess);
    }, {
      passive: true
    }

    closer.onmousedown = () => {
      opener?.classList.remove("hidden");
      if (pricebar) pricebar.classList.add("closed");
      uih_mobilePriceDisplay = "closed";
      resizeMobileUi(printess);
    }

    opener.ontouchstart = () => {
      if (pricebar) pricebar.classList.remove("closed");
      uih_mobilePriceDisplay = "open";
      resizeMobileUi(printess);
      opener?.classList.add("hidden");
    }, {
      passive: true
    }

    opener.onmousedown = () => {
      if (pricebar) pricebar.classList.remove("closed");
      uih_mobilePriceDisplay = "open";
      resizeMobileUi(printess);
      opener?.classList.add("hidden");
    }

    pricebar.appendChild(closer);
  }

  /*
  function getMobileSelectedProperty(properties: Array<iExternalProperty>): iExternalProperty | null {
    const selectedButton = document.querySelector(".mobile-property-button.selected");
    if (selectedButton) {
      const id = selectedButton.id.split(":")[0];
      const property = properties.filter(p => p.id === id)[0];
      if (property) {
        return property;
      }
    }
    return null;
  }
  */



  function resizeMobileUi(printess: iPrintessApi) { //, priceDisplayState: "none" | "open" | "close" = "none") {

    if (uih_autoSelectPending) return;

    const mobileUi = getMobileUiDiv();
    // const mobilePagebarDiv = getMobilePageBarDiv();
    const controlHost: HTMLElement | null = document.getElementById("mobile-control-host");
    // determine used-height of current controls
    if (mobileUi && controlHost) {

      const controlHostHeight = controlHost.offsetHeight;
      // read button bar height from CSS Variable.
      const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
      let mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");
      const mobilePriceBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pricebar-height").trim().replace("px", "") || "");
      const mobileButtonBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-buttonbar-height").trim().replace("px", "") || "");

      if (printess.pageNavigationDisplay() === "icons") {
        mobilePageBarHeight = 100;
      }
      if (mobileButtonBarHeight > 15) {
        //  debugger;
        if (document.body.classList.contains("no-mobile-button-bar")) {
          debugger;
        }
      }
      /* if (mobileButtonBarHeight === 0 && mobilePagebarDiv) {
         mobilePagebarDiv.style.display = "none";
       } else {
         mobilePagebarDiv.style.display = "block";
       }*/


      const printessDiv = document.getElementById("desktop-printess-container");

      if (printessDiv) {

        const viewPortHeight = uih_viewportHeight ? uih_viewportHeight : window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const viewPortWidth = uih_viewportWidth ? uih_viewportWidth : window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewPortTopOffset = uih_viewportOffsetTop; //  ?? window.visualViewport ? window.visualViewport.offsetTop : 0;

        const mobileUiHeight = (mobileButtonBarHeight + controlHostHeight + 2); // +2 = border-top
        let printessHeight = viewPortHeight - mobileUiHeight;

        //console.warn("viewPortHeight=" + viewPortHeight + "  viewPortTopOffset=" + viewPortTopOffset + "   printessHeight=" + printessHeight + "   mobileUiHeight=" + mobileUiHeight)

        let printessTop: number = viewPortTopOffset;

        const isInEddiMode = printess.isSoftwareKeyBoardExpanded() || (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "selection-text-style");

        let showToolBar: boolean = false;
        let showPageBar: boolean = false;
        let showPriceBar: boolean = false;
        const toolBar: HTMLDivElement | null = document.querySelector(".mobile-navbar");
        const pageBar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
        const priceBar: HTMLDivElement | null = document.querySelector(".mobile-pricebar");
        const priceBarOpener: HTMLDivElement | null = document.querySelector(".mobile-price-display-opener");
        if (pageBar && printess.pageNavigationDisplay() === "icons") {
          pageBar.style.height = mobilePageBarHeight + "px";
        }

        const hidePageAndToolbar = printessHeight < 450 && controlHostHeight > 10 || isInEddiMode || viewPortTopOffset > 0; // hide toolbar & pagebar to free up more space 
        showToolBar = !hidePageAndToolbar || printess.neverHideMobileToolbar();
        showPageBar = !hidePageAndToolbar;
        showPriceBar = !hidePageAndToolbar;

        // reduce printess-height by visible toolbar and pagebar
        if (toolbar && showToolBar) {
          printessTop += mobileNavBarHeight;
          printessHeight -= mobileNavBarHeight;
        }
        if (pageBar && showPageBar) {
          printessTop += mobilePageBarHeight;
          printessHeight -= mobilePageBarHeight;
        }

        if (priceBar && showPriceBar) {
          printessTop += mobilePriceBarHeight;
          printessHeight -= mobilePriceBarHeight;
        }

        if (priceBar && uih_mobilePriceDisplay === "closed") {
          printessTop -= mobilePriceBarHeight;
          printessHeight += mobilePriceBarHeight;
        }

        // if (printessHeight < 450 || isInEddiMode || viewPortTopOffset > 0) { // sometimes iphone sticks at some topoffset like 0.39...

        //   // hide toolbar & pagebar to free up more space 

        //   /* window.setTimeout(() => {
        //      const toolBar: HTMLDivElement | null = document.querySelector(".mobile-navbar");
        //      if (toolBar) toolBar.style.visibility = "hidden";
        //      const pageBar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
        //      if (pageBar) pageBar.style.visibility = "hidden";
        //    }, 400);*/

        // } else {
        //   // reduce printess-height by visible toolbar and pagebar 
        //   if (toolbar) {
        //     printessTop += mobileNavBarHeight;
        //     printessHeight -= mobileNavBarHeight;
        //     showToolBar = true;
        //   }
        //   if (pageBar) {
        //     showPageBar = true;
        //     printessTop += mobilePageBarHeight;
        //     printessHeight -= mobilePageBarHeight;
        //   }
        // }

        //console.warn("showToolBar=" + showToolBar + "  showPageBar=" + showPageBar + "   printessTop=" + printessTop)

        const activeFFId = getActiveFormFieldId();
        const focusSelection: boolean = printess.getZoomMode() === "frame";

        if ((focusSelection && activeFFId !== uih_lastFormFieldId) || uih_lastZoomMode !== printess.getZoomMode() || uih_lastMobileUiHeight !== mobileUiHeight || printessTop !== uih_lastPrintessTop || printessHeight !== uih_lastPrintessHeight || viewPortWidth !== uih_lastPrintessWidth) {
          uih_lastMobileUiHeight = mobileUiHeight;
          uih_lastPrintessTop = printessTop;
          uih_lastPrintessHeight = printessHeight;
          uih_lastPrintessWidth = viewPortWidth;
          uih_lastFormFieldId = activeFFId;
          uih_lastZoomMode = printess.getZoomMode();

          printessDiv.style.position = "fixed"; // to counter act relative positions above and width/height settings
          printessDiv.style.left = "0";
          printessDiv.style.right = "0";
          printessDiv.style.width = "";
          printessDiv.style.bottom = "";
          // printessDiv.style.bottom = (mobileButtonBarHeight + controlHostHeight) + "px";
          //  printessDiv.style.height = ((printessTop ?? 0) + printessHeight + mobileButtonBarHeight + controlHostHeight) + "px";
          printessDiv.style.height = printessHeight + "px";// + printessHeight + mobileButtonBarHeight + controlHostHeight) + "px";
          printessDiv.style.top = printessTop + "px";

          mobileUi.style.bottom = "";
          mobileUi.style.top = (viewPortTopOffset + viewPortHeight - mobileUiHeight) + "px";
          mobileUi.style.height = mobileUiHeight + "px;"

          if (toolBar) {
            if (showToolBar) {
              toolBar.style.visibility = "visible";
            } else {
              toolBar.style.visibility = "hidden";
            }
          }
          if (pageBar) {
            if (showPageBar) {
              pageBar.style.visibility = "visible";
            } else {
              pageBar.style.visibility = "hidden";
            }
          }
          if (priceBar) {
            if (showPriceBar) {
              priceBar.style.visibility = "visible";
            } else {
              priceBar.style.visibility = "hidden";
            }
          }
          if (priceBarOpener) {
            if (showPriceBar && uih_mobilePriceDisplay === "closed") {
              priceBarOpener.classList.remove("hidden");
            } else {
              priceBarOpener.classList.add("hidden");
            }
          }

          printess.resizePrintess(true, focusSelection, undefined, printessHeight, focusSelection ? activeFFId : undefined);
          // console.warn("resizePrintess height:" + printessHeight, window.visualViewport);
        }
      }
    }

  }

  function getMobileButtons(printess: iPrintessApi, barContainer?: HTMLDivElement, propertyIdFilter?: string, skipAutoSelect: boolean = false, fromImageSelection: boolean = false): { div: HTMLDivElement, autoSelectButton: iMobileUIButton | null } {
    const container: HTMLDivElement = barContainer || document.createElement("div");
    container.className = "mobile-buttons-container";



    const scrollContainer = document.createElement("div");
    scrollContainer.className = "mobile-buttons-scroll-container";
    //  window.setTimeout(() => { scrollContainer.scrollLeft = 120 }, 100);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "mobile-buttons";


    const buttons = printess.getMobileUiButtons(uih_currentProperties, propertyIdFilter || "root");

    if (uih_currentState === "document") {
      buttons.unshift(...printess.getMobileUiBackgroundButton());
    }

    if (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "image") {
      buttons.push(...printess.getMobileUiScissorsButtons());
    }

    const hasButtons = buttons.length > 0;

    if ((printess.spreadCount() > 1 && printess.pageNavigationDisplay() === "numbers") || (printess.pageNavigationDisplay() === "icons")) {
      renderPageNavigation(printess, getMobilePageBarDiv(), false, true);
    } else {
      const pagebar = document.querySelector(".mobile-pagebar");
      if (pagebar) pagebar.remove();
    }

    getMobilePriceBarDiv(printess);
    if (uih_currentPriceDisplay) {
      document.body.classList.add("has-mobile-price-bar");
    } else {
      document.body.classList.remove("has-mobile-price-bar");
    }

    let autoSelect: iMobileUIButton | null = null;
    let autoSelectHasMeta = false;
    let firstButton: HTMLDivElement | null = null;
    const ep = buttons[0]?.newState?.externalProperty;
    if (ep && buttons.length === 1 && skipAutoSelect !== true) {

      /*  if (ep.id.startsWith("FF_")) {
          // only auto show simple text-form fields not complex once - creates bad user experience
          if (ep.kind === 'single-line-text') {
            autoSelect = true;
          }
        }*/
      if (ep.kind === "image") {
        // auto-select image picker 
        autoSelect = buttons[0];
      }
      if (ep.kind === "single-line-text") {
        // auto-select text picker
        autoSelect = buttons[0];
      }

      //  autoSelect = true;
      autoSelectHasMeta = printess.hasMetaProperties(ep);


    }
    /*else if (uih_lastMobileState?.metaProperty){
      // if the user is eding TextSelection props and selecting a size, we do not want to close the control host 
      // Problem is only with text since it fires a selection change. 
      for (const b of buttons) {
        if (b.newState.metaProperty === uih_lastMobileState.metaProperty ) {
          // stay in that property.
          autoSelect = b; 
          autoSelectHasMeta = false;
          break;
        }
      }
    } */

    if (!hasButtons || (autoSelect && autoSelectHasMeta === false)) {
      // only show the property not the button bar with a single option which is already clicked 
      document.body.classList.add("no-mobile-button-bar");
    } else {
      document.body.classList.remove("no-mobile-button-bar");
    }

    if (hasButtons && (!autoSelect || autoSelectHasMeta === true)) {

      let controlGroup: number = 0;

      for (const b of buttons.filter(b => !b.hide)) {
        const selectScaleButton = b.newState.metaProperty === "image-scale" && b.newState.externalProperty?.imageMeta?.canScale && b.newState.externalProperty?.value !== b.newState.externalProperty?.validation?.defaultValue;
        const buttonDiv = document.createElement("div");
        buttonDiv.className = "no-selection";

        const properties: Array<iExternalProperty> = [];

        // render only one button per control group and display content together in controlHost
        if (b.newState.externalProperty && b.newState.externalProperty.controlGroup > 0 && b.newState.externalProperty.controlGroup === controlGroup) {
          continue;
        } else {
          if (b.newState.externalProperty && b.newState.externalProperty.controlGroup) {
            // start new control group: 
            controlGroup = b.newState.externalProperty.controlGroup;
            if (controlGroup > 0) {
              buttons.forEach(p => {
                if (p.newState.externalProperty && p.newState.externalProperty.controlGroup === controlGroup) {
                  properties.push(p.newState.externalProperty);
                }
              });
            }
          } else {
            controlGroup = 0;
          }
        }

        if (selectScaleButton && !autoSelect && fromImageSelection) {
          autoSelect = b;
          buttonDiv.classList.add("selected");
        }

        if (b.newState.tableRowIndex !== undefined) {
          buttonDiv.id = (b.newState.externalProperty?.id ?? "") + "$$$" + b.newState.tableRowIndex;
        } else {
          buttonDiv.id = (b.newState.externalProperty?.id ?? "") + ":" + (b.newState.metaProperty ?? "");
        }

        if (printess.isTextButton(b) || controlGroup > 0) {
          buttonDiv.classList.add("mobile-property-text");
        } else {
          buttonDiv.classList.add("mobile-property-button");
        }

        if (!firstButton) {
          firstButton = buttonDiv;
        }
        buttonDiv.onclick = () => {
          mobileUiButtonClick(printess, b, buttonDiv, container, false, properties);
        }

        if (b.newState.externalProperty?.kind === "background-button" || b.newState.externalProperty?.kind === "horizontal-scissor" || b.newState.externalProperty?.kind === "vertical-scissor") {
          drawButtonContent(printess, buttonDiv, [b.newState.externalProperty], controlGroup)
        } else if (controlGroup > 0) {
          drawButtonContent(printess, buttonDiv, properties, controlGroup);
        } else {
          drawButtonContent(printess, buttonDiv, uih_currentProperties, controlGroup);
        }

        buttonContainer.appendChild(buttonDiv);
      }

    }

    // if we are in eddi-selection mode we should show the same selected button as before the update
    if (uih_lastMobileState?.externalProperty?.kind === "selection-text-style") {
      const meta = uih_lastMobileState?.metaProperty;
      if (meta && !printess.isSoftwareKeyBoardExpanded()) {
        for (const b of buttons) {
          if (meta === b.newState.metaProperty) {
            //TODO: skipAutoSelect???? 
            autoSelect = b;
          }
        }
      }
    }

    if (autoSelect) {
      // Auto jump to first button action: 
      uih_autoSelectPending = true;
      window.setTimeout(() => {
        uih_autoSelectPending = false;
        const b = autoSelect;
        if (!b) return;
        if (b.newState.externalProperty?.kind === "background-button") {
          // jump directly to background frames 
          printess.selectBackground();
        } else if (autoSelectHasMeta) {
          let bid: string;
          if (b.newState.tableRowIndex !== undefined) {
            bid = (b.newState.externalProperty?.id ?? "") + "$$$" + b.newState.tableRowIndex;
          } else {
            bid = (b.newState.externalProperty?.id ?? "") + ":" + (b.newState.metaProperty ?? "");
          }
          const buttonDiv = <HTMLDivElement | null>(document.getElementById(bid));
          if (buttonDiv) {
            mobileUiButtonClick(printess, b, buttonDiv, container, true);
          } else {
            console.error("Auto-Click Button not found: " + bid);
          }
          // 
        } else {
          // if no meta data zoom to selected element or better when selection got focus?? 
          printess.setZoomMode("spread");
          renderMobileControlHost(printess, b.newState);
        }

      }, 50);
    }

    const scrollRight = document.createElement("div");
    scrollRight.className = "scroll-right-indicator"
    //scrollRight.appendChild(printess.getIcon("carret-right-solid"));

    scrollContainer.appendChild(buttonContainer);
    container.appendChild(scrollContainer);

    container.appendChild(scrollRight);

    if (firstButton && (autoSelect || printess.isSoftwareKeyBoardExpanded())) {
      // remove button bar animation in text-selection-mode it only creates flicker.
      firstButton.style.transition = "none";
    }

    window.setTimeout(() => {
      if (firstButton) {
        const containerWidth = container.offsetWidth;
        const buttonsWidth = buttonContainer.offsetWidth + 15 - (containerWidth * 1.45); // substract the animation way + right margin (0.45);
        if (buttonsWidth > containerWidth) {
          firstButton.style.marginLeft = "15px";
          container.classList.add("scroll-right");
          scrollContainer.onscroll = () => {
            if (scrollContainer.scrollLeft > buttonContainer.offsetWidth - (container.offsetWidth * 1.45)) {
              container.classList.remove("scroll-right");
            } else {
              container.classList.add("scroll-right");
            }
          }
        } else {
          // center buttons;
          const space = (containerWidth - buttonsWidth) / 2;
          firstButton.style.marginLeft = space + "px";

        }
      }
    }, 50);

    return { div: container, autoSelectButton: autoSelect };
  }

  async function mobileUiButtonClick(printess: iPrintessApi, b: iMobileUIButton, buttonDiv: HTMLDivElement, container: HTMLDivElement, fromAutoSelect: boolean, properties?: Array<iExternalProperty>) {

    printess.setZoomMode("spread");

    let hadSelectedButtons: boolean = false;
    const selectImageZoomButton = fromAutoSelect && b.newState.externalProperty?.kind === "image" && b.newState.externalProperty?.value !== b.newState.externalProperty?.validation?.defaultValue && b.newState.externalProperty?.imageMeta?.canScale;

    if (b.newState.externalProperty?.kind === "background-button") {
      printess.selectBackground();

    } else if (b.newState.externalProperty?.kind === "horizontal-scissor") {
      collapseControlHost();

      const sels = document.querySelectorAll(".mobile-property-button.selected");
      sels.forEach((ele) => ele.classList.remove("selected"));
      document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");

      await printess.splitFrame("vertical");

      if (printess.hasScissorMenu() === "never" || printess.hasScissorMenu() === "horizontical") {
        buttonDiv.remove();
      }

      return;

    } else if (b.newState.externalProperty?.kind === "vertical-scissor") {
      collapseControlHost();

      const sels = document.querySelectorAll(".mobile-property-button.selected");
      sels.forEach((ele) => ele.classList.remove("selected"));
      document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");

      await printess.splitFrame("horizontal");

      if (printess.hasScissorMenu() === "never" || printess.hasScissorMenu() === "vertical") {
        buttonDiv.remove();
      }

      return;

    } else if (b.newState.externalProperty?.kind === "image" && b.newState.metaProperty === "handwriting-image") {
      printess.removeHandwritingImage();
      return;

    } else if (b.newState.state === "table-add") {
      const p = b.newState.externalProperty;
      document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
      if (p?.tableMeta) {
        tableEditRowIndex = -1;
        tableEditRow = {};
        for (const col of p.tableMeta.columns) {
          tableEditRow[col.name] = col.list ? col.list[0] : col.data === "number" ? 0 : "";
        }
        if (p.tableMeta.tableType === "calendar-events") {
          tableEditRow.month = p.tableMeta.month || 1;
          tableEditRow.event = "Birthday";
        }

        renderMobileControlHost(printess, b.newState);
        getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "document", fromAutoSelect)); // group-snippets are only used with  "add" state


      }
    } else if (b.newState.state === "table-edit") {
      const p = b.newState.externalProperty;
      const rowIndex = b.newState.tableRowIndex ?? -1;
      document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");
      centerMobileButton(buttonDiv);
      if (p?.tableMeta && (rowIndex ?? -1) >= 0) {
        try {
          const data: Array<Record<string, any>> = JSON.parse(p.value.toString())
          tableEditRow = data[rowIndex];
          tableEditRowIndex = rowIndex;
          printess.setTableRowIndex(p.id, rowIndex);
          renderMobileControlHost(printess, b.newState);
          getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "document", fromAutoSelect, willHaveControlHost(b.newState))); // group-snippets are only used with  "add" state

        } catch (error) {
          console.error("property table has no array data:" + p.id)
        }

      }

    } else if (b.hasCollapsedMetaProperties === true && b.newState.externalProperty) {
      // render details button bar with meta-properties for images and stories
      uih_currentState = "details";
      const buttonContainer = document.querySelector(".mobile-buttons-container");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        getMobileButtons(printess, container, b.newState.externalProperty.id);

        const backButton = document.querySelector(".mobile-property-back-button");
        if (backButton) {
          backButton.parentElement?.removeChild(backButton);
        }
        const mobilePlusButton = document.querySelector(".mobile-property-plus-button");
        if (mobilePlusButton) {
          mobilePlusButton.parentElement?.removeChild(mobilePlusButton);
        }
        getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "details", fromAutoSelect, willHaveControlHost(b.newState))); // group-snippets are only used with  "add" state
        if (!fromAutoSelect) { // b.newState.externalProperty.kind === "multi-line-text") {
          printess.setZoomMode("frame");
        }
        if (selectImageZoomButton) {
          window.setTimeout(() => {
            const bid = (b.newState.externalProperty?.id ?? "") + ":image-scale";
            const buttonDiv = <HTMLDivElement | null>(document.getElementById(bid));
            if (buttonDiv) {
              buttonDiv.classList.toggle("selected");
              buttonDiv.innerHTML = "";
              properties = properties && properties.length > 0 ? properties : uih_currentProperties;
              drawButtonContent(printess, buttonDiv, properties, b.newState.externalProperty?.controlGroup || 0);
              if (b.newState.externalProperty?.kind === "image" && (printess.canMoveSelectedFrames() || printess.canSplitSelectedFrames())) {
                // for images its not good to zoom if they are moveable. Quite impossible to catch the handles 
                printess.setZoomMode("spread");
              } else {
                printess.setZoomMode("frame");
              }
            }
          }, 10)
          b.newState = { ...b.newState, metaProperty: "image-scale" };
        }
      }
    } else if (b.newState.externalProperty && b.newState.externalProperty.kind === "checkbox") {
      const id = b.newState.externalProperty.id;
      const value = b.newState.externalProperty.value;
      printess.setProperty(id, value === "true" ? "false" : "true").then(() => setPropertyVisibilities(printess));
      b.newState.externalProperty.value = value === "true" ? "false" : "true";

      drawButtonContent(printess, buttonDiv, [b.newState.externalProperty], b.newState.externalProperty.controlGroup);

      printess.setZoomMode("spread");
      collapseControlHost();
      resizeMobileUi(printess);

      const sels = document.querySelectorAll(".mobile-property-button.selected");
      sels.forEach((ele) => ele.classList.remove("selected"));
      document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");
      centerMobileButton(buttonDiv);

      return;

    } else {
      const sels = document.querySelectorAll(".mobile-property-button.selected");
      hadSelectedButtons = sels.length > 0;
      sels.forEach((ele) => ele.classList.remove("selected"));
      document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");
      buttonDiv.innerHTML = "";
      if (b.newState.externalProperty && b.newState.externalProperty.controlGroup > 0) {
        properties = properties || uih_currentProperties;
      } else if (b.newState.externalProperty) {
        properties = [b.newState.externalProperty];
      } else {
        properties = uih_currentProperties;
      }
      drawButtonContent(printess, buttonDiv, properties, b.newState.externalProperty?.controlGroup || 0);
      centerMobileButton(buttonDiv);

      // center frame 
      // const pId = b.newState.externalProperty?.id ?? "";

      /* if (pId.startsWith("FF_")) {
         ffId = pId.substr(3);
       }*/
      if (b.newState.externalProperty?.kind === "image" && (printess.canMoveSelectedFrames() || printess.canSplitSelectedFrames())) {
        // for images its not good to zoom if they are moveable. Quite impossible to catch the handles 
        printess.setZoomMode("spread");
      } else {
        printess.setZoomMode("frame");
      }


      // if a form field on doc level was selectected, we might not have a back button, so add one just in case 
      const backButton = document.querySelector(".mobile-property-back-button");
      if (backButton) {
        backButton.parentElement?.removeChild(backButton);
      }

      getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, uih_currentState, fromAutoSelect, willHaveControlHost(b.newState)));

      if (b.newState.externalProperty?.kind === "selection-text-style" && !hadSelectedButtons) {
        // rich text editing
        // add some delay, to give the browser time to draw-in keyboard
        window.setTimeout(() => {
          renderMobileControlHost(printess, b.newState);
        }, 500);
        return;
      }


    }
    // render control
    renderMobileControlHost(printess, b.newState, properties);



  }
  function willHaveControlHost(state: iMobileUiState): boolean {
    // please adjust if changing: renderMobileControlHost()

    if (state.state === "add") {
      return true;
    } else if (state.externalProperty) {
      return true;
    }

    return false;

  }

  function renderMobileControlHost(printess: iPrintessApi, state: iMobileUiState, properties?: Array<iExternalProperty>) {

    collapseControlHost();

    const controlHost = document.getElementById("mobile-control-host");
    uih_lastMobileState = state;

    if (controlHost) {
      controlHost.style.overflow = "hidden auto";

      if (state.state === "add") {
        controlHost.classList.add("mobile-control-xl");
        const snippets = renderGroupSnippets(printess, uih_currentGroupSnippets || [], true);
        controlHost.appendChild(snippets);

      } else if (state.externalProperty) {
        controlHost.classList.add(getMobileControlHeightClass(printess, state.externalProperty, state.metaProperty));
        if (state.state === "table-add" || state.state === "table-edit") {
          const control = renderTableDetails(printess, state.externalProperty, true);
          controlHost.appendChild(control);
        } else {
          if (properties && properties.length > 0 && properties[0].controlGroup > 0) {
            // render control grouped input fields together
            controlHost.style.overflow = "auto";
            getProperties(printess, uih_currentState, properties, controlHost);
          } else {
            const control = getPropertyControl(printess, state.externalProperty, state.metaProperty, true);
            controlHost.appendChild(control);
          }
        }

        // only if hasButtonBar!!!, sonst ok button drunter rendern 
        const close = getMobileNavButton({
          name: "closeHost",
          icon: printess.getIcon("carret-down-solid"),
          task: () => {
            printess.setZoomMode("spread");
            collapseControlHost();
            resizeMobileUi(printess);
            const mobileBtns = document.querySelector(".mobile-buttons")
            if (mobileBtns) {
              mobileBtns.childNodes.forEach(b => (<HTMLDivElement>b).classList.remove("selected"));
            }
          }
        }, true)
        close.classList.add("close-control-host-button");

        const mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
        if (mobileUi) {
          if (!document.body.classList.contains("no-mobile-button-bar")) {
            // also check if maybe ok button is present 
            mobileUi.appendChild(close);
          }
        }


        resizeMobileUi(printess); // fromAutoSelect ? true : true);
        //validate(printess, state.externalProperty)
      }
    }
  }

  function collapseControlHost() {
    const controlHost = document.getElementById("mobile-control-host");
    const mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");

    if (mobileUi) {
      const closeButton = mobileUi.querySelector(".close-control-host-button");
      if (closeButton) {
        mobileUi.removeChild(closeButton);
      }
    }

    if (controlHost) {
      controlHost.classList.remove("mobile-control-sm");
      controlHost.classList.remove("mobile-control-md");
      controlHost.classList.remove("mobile-control-lg");
      controlHost.classList.remove("mobile-control-xl");
      controlHost.classList.remove("mobile-control-xxl");
      controlHost.innerHTML = "";
    }
  }

  function getMobileControlHeightClass(printess: iPrintessApi, property: iExternalProperty, meta?: iExternalMetaPropertyKind): string {
    switch (property.kind) {
      case "image":
      case "image-id":
        // if (!meta) {
        //   if (printess.getUploadedImagesCount() <= 3) {
        //     return "mobile-control-lg"
        //   } else {
        //     return "mobile-control-overlay"
        //   }
        // } else if (meta === "image-rotation") {
        //   return "mobile-control-lg";
        // }
        return "mobile-control-md";
      case "selection-text-style":
        // for rich text editing
        // always larger, because keyboard is large 
        // damit wenn man vom keyboard zur farbe wechselt der zoom nicht so hin- und her wackelt
        return "mobile-control-lg";
      case "multi-line-text":
        if (!meta || meta === "text-style-color" || meta === "text-style-font" || meta === "text-style-size" || meta === "text-style-vAlign-hAlign") {
          if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
            return "mobile-control-xl"
          } else {
            return "mobile-control-lg"
          }
        }
        break;
      case "select-list":
        if (property.controlGroup > 0) {
          return "mobile-control-sm";
        } else {
          return "mobile-control-lg";
        }
      case "color":
      case "image-list":
      case "color-list":
      case "font":
        return "mobile-control-lg"
      case "text-area":
        if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
          return "mobile-control-xl"
        } else {
          return "mobile-control-lg"
        }
      case "table":
        return "mobile-control-xl"
      case "single-line-text":
        if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
          //console.log(window.navigator.appVersion);
          return "mobile-control-sm"
        } else {
          return "mobile-control-sm"
        }
    }

    return "mobile-control-sm"
  }


  function drawButtonContent(printess: iPrintessApi, buttonDiv: HTMLDivElement, properties: Array<iExternalProperty>, controlGroup: number) {

    // find property by button id.
    const id = buttonDiv.id.split(":")
    let propertyId = id[0];
    let rowIndex: number | undefined = undefined;
    if (propertyId.startsWith("FF") && propertyId.indexOf("$$$") > 0) {
      const tId = propertyId.split("$$$");
      propertyId = tId[0];
      rowIndex = isNaN(+tId[1]) ? undefined : +tId[1];
    }
    const metaProperty = id[1] ?? ""
    const property = properties.filter(p => p.id === propertyId)[0];
    if (!property) return

    const buttons = printess.getMobileUiButtons([property], propertyId);
    let b: iMobileUIButton | undefined = undefined;
    if (rowIndex !== undefined) {
      for (const button of buttons) {
        if (button.newState.tableRowIndex === rowIndex) {
          b = button;
          break;
        }
      }
    } else {
      for (const button of buttons) {
        if ((button.newState.metaProperty ?? "") === metaProperty) {
          b = button;
          break;
        }
      }
    }
    if (!b) return;


    const isSelected = buttonDiv.classList.contains("selected");
    buttonDiv.innerHTML = "";

    if (printess.isTextButton(b) || controlGroup > 0) {
      let caption: string = "";

      if (controlGroup > 0) {
        for (const p of properties) {
          caption += p.label + " ";
        }
      } else {
        caption = printess.gl(b.caption);
      }

      const buttonText = document.createElement("div");
      buttonText.className = "text";
      buttonText.innerText = caption;

      const buttonIcon = document.createElement("div");
      buttonIcon.className = "icon";
      buttonIcon.innerText = "T";

      buttonDiv.appendChild(buttonText);
      buttonDiv.appendChild(buttonIcon);


    } else {

      const buttonCircle = getButtonCircle(printess, b, isSelected);

      const buttonText = document.createElement("div");
      buttonText.className = "mobile-property-caption no-selection";
      buttonText.innerText = printess.gl(b.caption);

      buttonDiv.appendChild(buttonCircle);
      buttonDiv.appendChild(buttonText);

    }
  }

  function getButtonCircle(printess: iPrintessApi, m: iMobileUIButton, isSelected: boolean): HTMLDivElement {

    const c = printess.getButtonCircleModel(m, isSelected);

    const circle = document.createElement("div");
    circle.className = "circle-button-graphic";
    if (c.hasSvgCircle) {
      circle.appendChild(getSvgCircle(c.displayGauge, c.gaugeValue));
    }
    if (c.hasImage) {
      const image = document.createElement("div");
      image.classList.add("circular-image");
      if (m.circleStyle) image.setAttribute("style", m.circleStyle);
      if (m.thumbCssUrl) image.style.backgroundImage = m.thumbCssUrl;
      circle.appendChild(image);
    }
    if (c.hasCaption) {
      const caption = document.createElement("div");
      caption.className = c.captionClass;
      caption.innerText = printess.gl(c.captionInCircle);
      circle.appendChild(caption);
    }
    if (c.hasColor) {
      const color = document.createElement("div");
      color.classList.add("circular-color");

      color.style.backgroundColor = c.color;
      color.innerText = printess.gl(c.captionInCircle);

      if (c.color === "transparent") {
        const redLine = document.createElement("div");
        redLine.className = "red-line-for-transparent-color";
        redLine.style.top = "18px";
        redLine.style.left = "8px";
        redLine.style.width = "22px";

        color.style.border = "1px solid #555555";
        color.appendChild(redLine);
      }

      circle.appendChild(color);
    }
    if (c.hasIcon && c.icon !== "none") {

      const icon = printess.getIcon(c.icon);
      icon.classList.add("circle-button-icon");

      if (m.newState.externalProperty?.kind === "vertical-scissor") {
        const scissorsLine = document.createElement("div");
        scissorsLine.className = "vertical-scissor-button";
        circle.appendChild(scissorsLine);

        icon.style.transform = "rotateZ(-90deg)";
      }

      if (m.newState.externalProperty?.kind === "horizontal-scissor") {
        const scissorsLine = document.createElement("div");
        scissorsLine.className = "horizontal-scissor-button";
        circle.appendChild(scissorsLine);
      }

      circle.appendChild(icon);
      // `<wc-icon class="circle-button-icon" primaryColor="toolbar" icon="${c.icon}"></wc-icon>
    }
    return circle;
  }


  function getSvgCircle(displayGauge: boolean, gaugeValue: number): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttributeNS(null, "viewBox", "0 0 36 36");
    svg.classList.add("circular-svg");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("circle-bg");
    path.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");

    svg.appendChild(path);

    if (displayGauge && gaugeValue !== 0) {
      const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      innerPath.classList.add("circle");
      if (gaugeValue < 0) {
        innerPath.setAttributeNS(null, "transform", "scale(-1,1) translate(-36,0)");
      }
      innerPath.setAttributeNS(null, "stroke-dasharray", Math.abs(gaugeValue) + ",100");
      innerPath.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");
      svg.appendChild(innerPath);
    }
    return svg;
  }

  function centerMobileButton(buttonDiv: HTMLDivElement): void {

    const eX = buttonDiv.offsetLeft;
    const scrollContainer = <HTMLDivElement>document.querySelector(".mobile-buttons-scroll-container");
    const mobileUi = <HTMLDivElement>document.querySelector(".mobile-ui");
    if (scrollContainer && mobileUi) {
      const vw = mobileUi.offsetWidth;
      scrollToLeft(scrollContainer, eX - vw / 2 + buttonDiv.offsetWidth / 2, 300);
      //container.scrollLeft = eX - vw/2 + ele.offsetWidth / 2;
    }

  }

  function scrollToLeft(element: HTMLDivElement, to: number, duration: number, startPosition?: number): void {
    const start = startPosition ?? element.scrollLeft;
    const change = to - start;
    let currentTime = 0;
    const increment = 10;

    const animateScroll = function () {
      currentTime += increment;
      const val = easeInOutQuad(currentTime, start, change, duration);
      element.scrollLeft = val;
      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    };
    animateScroll();
  }

  //t = current time
  //b = start value
  //c = change in value
  //d = duration
  function easeInOutQuad(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }



  /*
   *   Overlay Callbacks
   */
  function getOverlay(printess: iPrintessApi, properties: Array<iExternalProperty>): HTMLElement {
    // console.log("+++++++Properties", properties);
    const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
    const isImage = properties.filter(p => p.kind === "image").length > 0;
    const isColor = properties.filter(p => p.kind === "color").length > 0;
    const hdiv = document.createElement("div");

    hdiv.style.opacity = "1";

    if (isSingleLineText) {
      const tdiv = getOverlayIcon(printess, "text", "rgba(255,100,0,1)");
      hdiv.style.border = "5px solid rgba(255,100,0,0.5)";
      hdiv.appendChild(tdiv);
    } else if (isImage) {
      const tdiv = getOverlayIcon(printess, "image", "rgba(0,125,255,1)");
      hdiv.style.border = "5px solid rgba(0,125,255,0.5)";
      hdiv.appendChild(tdiv);

    } else if (isColor) {
      const tdiv = getOverlayIcon(printess, "palette", "rgba(100,250,0,1)");
      hdiv.style.border = "5px solid rgba(100,250,0,0.5)";
      hdiv.appendChild(tdiv);
    } else {
      const tdiv = getOverlayIcon(printess, "cog", "rgba(200,0,100,1)");
      hdiv.style.border = "5px solid rgba(200,0,100,0.5)";
      hdiv.appendChild(tdiv);
    }
    return hdiv;
  }

  function getOverlayIcon(printess: iPrintessApi, name: iconName, color: string): HTMLDivElement {
    const tdiv = document.createElement("div");
    tdiv.style.position = "absolute";
    tdiv.style.top = "-16px"
    tdiv.style.left = "-16px";
    tdiv.style.backgroundColor = color;
    tdiv.style.padding = "7px";
    tdiv.style.width = "36px";
    tdiv.style.height = "36px";
    tdiv.style.borderRadius = "50%";

    const icon = printess.getIcon(name);
    icon.style.width = "22px";
    icon.style.height = "22px";
    icon.style.color = "white";
    tdiv.appendChild(icon);

    return tdiv;
  }

})();


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    window.uiHelper = {
        renderLayoutSnippets: renderLayoutSnippets,
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
        customLayouSnippetRenderCallback: undefined
    };
    function resetUi() {
        uih_currentTabId = "LOADING";
        uih_currentPriceDisplay = undefined;
        uih_mobilePriceDisplay = "none";
    }
    let uih_viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let uih_viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    let uih_viewportOffsetTop = 0;
    let uih_currentGroupSnippets = [];
    let uih_currentProperties = [];
    let uih_currentTabs = [];
    let uih_currentTabId = "LOADING";
    let uih_currentLayoutSnippets = [];
    let uih_currentState = "document";
    let uih_currentRender = "never";
    let uih_currentVisiblePage;
    let uih_currentPriceDisplay;
    let uih_mobilePriceDisplay = "none";
    let uih_lastMobileState = null;
    let uih_autoSelectPending = false;
    let uih_lastPrintessHeight = 0;
    let uih_lastPrintessWidth = 0;
    let uih_lastPrintessTop = null;
    let uih_lastMobileUiHeight = 0;
    let uih_lastZoomMode = "unset";
    let uih_lastFormFieldId = undefined;
    let uih_stepTabOffset = 0;
    let uih_stepTabsScrollPosition = 0;
    let uih_snippetsScrollPosition = 0;
    let uih_lastOverflowState = false;
    let uih_activeImageAccordion = "Buyer Upload";
    let uih_ignoredLowResolutionErrors = [];
    let uih_layoutSelectionDialogHasBeenRendered = false;
    let uih_lastDragTarget;
    function validateAllInputs(printess) {
        const errors = printess.validate("all");
        const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
        if (filteredErrors.length > 0) {
            printess.bringErrorIntoView(filteredErrors[0]);
            getValidationOverlay(printess, filteredErrors, "validateAll");
            return false;
        }
        return true;
    }
    function handleBackButtonCallback(printess, callback) {
        if (printess.isInDesignerMode()) {
            callback("");
        }
        else {
            printess.save().then((token) => {
                callback(token);
            }).catch(reason => {
                console.error(reason);
                callback("");
            });
        }
        const closeLayoutsButton = document.getElementById("closeLayoutOffCanvas");
        if (closeLayoutsButton) {
            closeLayoutsButton.click();
        }
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
        if (layoutHint)
            layoutHint.remove();
        const expertHint = document.getElementById("ui-hint-expertMode");
        if (expertHint)
            expertHint.remove();
        const editableFrameHint = document.querySelector("div#frame-pulse.frame-hint-pulse");
        if (editableFrameHint) {
            editableFrameHint.remove();
        }
    }
    function addToBasket(printess) {
        return __awaiter(this, void 0, void 0, function* () {
            if (validateAllInputs(printess) === false) {
                return;
            }
            const callback = printess.getAddToBasketCallback();
            if (callback) {
                yield printess.clearSelection();
                printess.showOverlay(printess.gl("ui.saveProgress"));
                const saveToken = yield printess.save();
                let url = "";
                if (printess.noBasketThumbnail() !== true) {
                    url = yield printess.renderFirstPageImage("thumbnail.png");
                }
                callback(saveToken, url);
                printess.hideOverlay();
            }
            else {
                alert(printess.gl("ui.addToBasketCallback"));
            }
        });
    }
    function gotoNextStep(printess) {
        const errors = printess.validate(printess.hasNextStep() ? "until-current-step" : "all");
        const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
        if (filteredErrors.length > 0) {
            printess.bringErrorIntoView(filteredErrors[0]);
            getValidationOverlay(printess, filteredErrors, "next");
            return;
        }
        if (printess.hasNextStep()) {
            printess.nextStep();
        }
        else {
            addToBasket(printess);
        }
    }
    function gotoStep(printess, stepIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = printess.validate("until-current-step");
            const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
            if (filteredErrors.length > 0) {
                printess.bringErrorIntoView(filteredErrors[0]);
                getValidationOverlay(printess, filteredErrors, "next", stepIndex);
                return;
            }
            return printess.setStep(stepIndex);
        });
    }
    function viewPortScroll(printess) {
        if (printess) {
            _viewPortScroll(printess, "scroll");
        }
    }
    function viewPortResize(printess) {
        if (printess) {
            checkAndSwitchViews(printess);
            _viewPortScroll(printess, "resize");
        }
    }
    function resize(printess) {
        if (printess) {
            checkAndSwitchViews(printess);
            printess.resizePrintess(false, false, undefined);
        }
    }
    function checkAndSwitchViews(printess) {
        if (printess) {
            const mobile = printess.isMobile();
            if (mobile && uih_currentRender !== "mobile") {
                renderMobileUi(printess);
                renderMobileNavBar(printess);
            }
            if (!mobile && uih_currentRender !== "desktop") {
                renderDesktopUi(printess);
            }
        }
    }
    function refreshPriceDisplay(printess, priceDisplay) {
        uih_currentPriceDisplay = priceDisplay;
        if (priceDisplay && uih_currentRender === "mobile") {
            document.body.classList.add("has-mobile-price-bar");
            resizeMobileUi(printess);
        }
        else {
            document.body.classList.remove("has-mobile-price-bar");
        }
        const priceDiv = document.getElementById("total-price-display");
        if (priceDiv) {
            getPriceDisplay(printess, priceDiv, priceDisplay, uih_currentRender === "mobile");
        }
        console.error("NEW PRICING ARRIVED", priceDisplay);
    }
    function getIframeOverlay(printess, title, infoUrl, forMobile) {
        const iframe = document.createElement("iframe");
        iframe.title = printess.gl(title);
        iframe.src = infoUrl.startsWith("/") ? window.location.origin + infoUrl : infoUrl;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        if (forMobile) {
            const productInfoDiv = document.getElementById("PRICE-INFO");
            if (productInfoDiv) {
                productInfoDiv.remove();
            }
            renderMobileDialogFullscreen(printess, "PRICE-INFO", title, iframe, false);
        }
        else {
            showModal(printess, "PRICE-MODAL", iframe, title);
        }
    }
    function getPriceDisplay(printess, priceDiv, priceDisplay, forMobile = false) {
        const price = (priceDisplay === null || priceDisplay === void 0 ? void 0 : priceDisplay.price) || "";
        const oldPrice = (priceDisplay === null || priceDisplay === void 0 ? void 0 : priceDisplay.oldPrice) || "";
        const legalNotice = (priceDisplay === null || priceDisplay === void 0 ? void 0 : priceDisplay.legalNotice) || "";
        const productName = (priceDisplay === null || priceDisplay === void 0 ? void 0 : priceDisplay.productName) || printess.getTemplateTitle();
        const infoUrl = (priceDisplay === null || priceDisplay === void 0 ? void 0 : priceDisplay.infoUrl) || "";
        priceDiv.innerHTML = "";
        const headline = document.createElement("div");
        headline.className = "total-price-headline";
        if (productName && (printess.pageNavigationDisplay() === "icons" || printess.stepHeaderDisplay() === "tabs list" || forMobile)) {
            const productNameSpan = document.createElement("span");
            productNameSpan.className = "product-name";
            productNameSpan.innerText = printess.gl(productName);
            if (infoUrl) {
                const infoIcon = printess.getIcon("info-circle");
                infoIcon.classList.add("price-info-icon");
                infoIcon.onclick = () => getIframeOverlay(printess, printess.gl("ui.productOverview"), infoUrl, forMobile);
                productNameSpan.appendChild(infoIcon);
            }
            priceDiv.appendChild(productNameSpan);
        }
        if (!legalNotice) {
            priceDiv.classList.add("price-info-only");
        }
        else {
            priceDiv.classList.remove("price-info-only");
        }
        const oldPriceSpan = document.createElement("span");
        oldPriceSpan.style.textDecoration = "line-through";
        oldPriceSpan.className = "me-2";
        oldPriceSpan.innerText = printess.gl(oldPrice);
        const newPriceSpan = document.createElement("span");
        if (oldPrice)
            newPriceSpan.style.color = "red";
        newPriceSpan.innerText = printess.gl(price);
        if (infoUrl && printess.pageNavigationDisplay() !== "icons" && printess.stepHeaderDisplay() !== "tabs list" && (!forMobile || !productName)) {
            const infoIcon = printess.getIcon("info-circle");
            infoIcon.classList.add("price-info-icon");
            if (oldPrice)
                infoIcon.style.marginRight = "6px";
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
    function getLegalNoticeText(printess, legalNotice, forMobile) {
        const regex = /\[([^)]*)\]\(([^\]]*)\)/gm;
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
                    if (agb)
                        agb.onclick = () => getIframeOverlay(printess, text, link, forMobile);
                }, 100);
            }
        }
        return legalNotice;
    }
    function refreshPagination(printess) {
        if (uih_currentRender === "mobile") {
            renderPageNavigation(printess, getMobilePageBarDiv(), false, true);
            renderMobileNavBar(printess);
        }
        else {
            renderPageNavigation(printess);
        }
    }
    function _viewPortScroll(printess, _what) {
        if (uih_viewportOffsetTop !== window.visualViewport.offsetTop || uih_viewportHeight !== window.visualViewport.height || uih_viewportWidth !== window.visualViewport.width) {
            uih_viewportOffsetTop = window.visualViewport.offsetTop;
            uih_viewportHeight = window.visualViewport.height;
            uih_viewportWidth = window.visualViewport.width;
            const printessDiv = document.getElementById("desktop-printess-container");
            if (printessDiv) {
                if (printess.isMobile()) {
                    printessDiv.style.height = "";
                    resizeMobileUi(printess);
                }
                else {
                    const desktopGrid = document.getElementById("printess-desktop-grid");
                    if (desktopGrid) {
                        if (printess.autoScaleDetails().enabled) {
                            printessDiv.style.height = Math.floor(printess.autoScaleDetails().height - 1) + "px";
                            printessDiv.style.width = Math.floor(printess.autoScaleDetails().width - 1) + "px";
                            printess.resizePrintess();
                        }
                        else {
                            const height = desktopGrid.offsetHeight || window.innerHeight;
                            const calcHeight = "calc(" + Math.floor(height) + "px - var(--editor-pagebar-height) - var(--editor-margin-top) - var(--editor-margin-bottom))";
                            printessDiv.style.height = calcHeight;
                            const desktopProperties = document.getElementById("desktop-properties");
                            const tabsContainer = document.querySelector(".tabs-navigation");
                            if (printess.showTabNavigation() && desktopProperties) {
                                desktopProperties.style.height = calcHeight;
                                if (tabsContainer) {
                                    renderTabsNavigation(printess, tabsContainer, false);
                                }
                            }
                            printess.resizePrintess();
                        }
                    }
                }
            }
        }
    }
    function getActiveFormFieldId() {
        const ele = document.querySelector('.mobile-control-host input[type="text"]');
        if (ele && ele.id && ele.id.startsWith("inp_FF_")) {
            return ele.id.substr(7);
        }
        return undefined;
    }
    function viewPortScrollInIFrame(printess, vpHeight, vpOffsetTop) {
        uih_viewportHeight = vpHeight;
        uih_viewportOffsetTop = vpOffsetTop;
        uih_viewportWidth = window.innerWidth;
        printess.setIFrameViewPort({ offsetTop: vpOffsetTop, height: vpHeight });
        const printessDiv = document.getElementById("desktop-printess-container");
        if (printessDiv) {
            resizeMobileUi(printess);
        }
    }
    function renderDesktopUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets, layoutSnippets = uih_currentLayoutSnippets, tabs = uih_currentTabs) {
        var _a, _b, _c;
        if (uih_currentRender === "never") {
            if (window.visualViewport && !printess.autoScaleEnabled()) {
                uih_viewportHeight = -1;
                _viewPortScroll(printess, "resize");
            }
            else {
                printess.resizePrintess();
            }
        }
        else if (uih_currentRender === "mobile" && printess.autoScaleDetails().enabled) {
            printess.resizePrintess();
        }
        uih_currentTabs = tabs;
        uih_currentGroupSnippets = groupSnippets;
        uih_currentLayoutSnippets = layoutSnippets;
        uih_currentState = state;
        uih_currentProperties = properties;
        uih_currentRender = "desktop";
        const mobileUi = document.querySelector(".mobile-ui");
        if (mobileUi) {
            mobileUi.innerHTML = "";
        }
        removeMobileFullscreenContainer();
        const mobilePricebar = document.querySelector(".mobile-pricebar");
        if (mobilePricebar) {
            mobilePricebar.remove();
        }
        const mobilePricebarOpener = document.querySelector(".mobile-price-display-opener");
        if (mobilePricebarOpener) {
            mobilePricebarOpener.remove();
        }
        const printessDiv = document.getElementById("desktop-printess-container");
        const container = document.getElementById("desktop-properties");
        if (!container || !printessDiv) {
            throw new Error("#desktop-properties or #desktop-printess-container not found, please add to html.");
        }
        if (printess.stepHeaderDisplay() === "tabs list" || printess.pageNavigationDisplay() === "icons") {
            container.classList.add("move-down");
        }
        else {
            container.classList.remove("move-down");
        }
        printessDiv.style.position = "relative";
        printessDiv.style.top = "";
        printessDiv.style.left = "";
        printessDiv.style.bottom = "";
        printessDiv.style.right = "";
        container.innerHTML = "";
        container.style.height = "-webkit-fill-available";
        let t = [];
        const nav = getMobileNavbarDiv();
        if (nav)
            (_a = nav.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(nav);
        renderPageNavigation(printess);
        let desktopTitleOrSteps = document.querySelector("div.desktop-title-or-steps");
        if (!desktopTitleOrSteps) {
            desktopTitleOrSteps = document.createElement("div");
            desktopTitleOrSteps.className = "desktop-title-or-steps";
        }
        else {
            desktopTitleOrSteps.innerHTML = "";
        }
        if (printess.stepHeaderDisplay() !== "tabs list" && printess.pageNavigationDisplay() !== "icons") {
            if (printess.hasSteps()) {
                const desktopStepsUi = getDesktopStepsUi(printess);
                if (printess.showTabNavigation()) {
                    desktopTitleOrSteps.appendChild(desktopStepsUi);
                }
                else {
                    container.appendChild(desktopStepsUi);
                }
            }
            else {
                const desktopTitle = getDesktopTitle(printess);
                if (printess.showTabNavigation()) {
                    desktopTitleOrSteps.appendChild(desktopTitle);
                }
                else {
                    container.appendChild(desktopTitle);
                }
            }
        }
        if (printess.hasPreviewBackButton() && !printess.showTabNavigation()) {
            printessDiv.classList.add("preview-fullwidth-grid");
            printess.resizePrintess();
        }
        else if (printessDiv.classList.contains("preview-fullwidth-grid")) {
            printessDiv.classList.remove("preview-fullwidth-grid");
            printess.resizePrintess();
        }
        adjustDesktopView(printess, desktopTitleOrSteps, container, printessDiv, state);
        if (printess.hasSelection()) {
            sessionStorage.setItem("editableFrames", "hint closed");
            const framePulse = document.getElementById("frame-pulse");
            if (framePulse)
                (_b = framePulse.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(framePulse);
        }
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton) {
            layoutsButton.textContent = printess.gl("ui.changeLayout");
            if (printess.showTabNavigation()) {
                layoutsButton.style.visibility = "hidden";
            }
            else if (layoutSnippets.length > 0) {
                layoutsButton.style.visibility = "visible";
            }
        }
        renderUiButtonHints(printess, document.body, state, false);
        renderEditableFramesHint(printess);
        const printessBuyerPropertiesButton = document.getElementById("printessBuyerPropertiesButton");
        if (printessBuyerPropertiesButton) {
            if (printess.hasPreviewBackButton()) {
                printessBuyerPropertiesButton.style.display = "none";
            }
            else {
                printessBuyerPropertiesButton.style.display = "block";
            }
        }
        if (!uih_layoutSelectionDialogHasBeenRendered && layoutSnippets.length > 0 && printess.showLayoutsDialog()) {
            uih_layoutSelectionDialogHasBeenRendered = true;
            renderLayoutSelectionDialog(printess, layoutSnippets, false);
        }
        if (state === "document" && printess.hasLayoutSnippets() && !sessionStorage.getItem("changeLayout") && !printess.showTabNavigation()) {
            toggleChangeLayoutButtonHint();
        }
        if (printess.hasPreviewBackButton()) {
        }
        else if (state === "document") {
            const propsDiv = document.createElement("div");
            const props = getProperties(printess, state, properties, propsDiv);
            t = t.concat(props);
            if (printess.hasBackground() && !printess.showTabNavigation()) {
                propsDiv.appendChild(getChangeBackgroundButton(printess));
            }
            if (printess.showTabNavigation()) {
                if (uih_currentTabId) {
                    container.appendChild(getPropertiesTitle(printess));
                    if (uih_currentTabId === "#FORMFIELDS") {
                        container.appendChild(propsDiv);
                    }
                    else {
                        renderTabNavigationProperties(printess, container, false);
                    }
                }
                else {
                    container.appendChild(propsDiv);
                }
            }
            else {
                container.appendChild(propsDiv);
                container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
            }
            if (printess.showTabNavigation() && printess.stepHeaderDisplay() === "tabs list") {
            }
            else if (printess.hasSteps()) {
                container.appendChild(getDoneButton(printess));
            }
        }
        else {
            const renderPhotoTabForEmptyImage = false;
            if (printess.showTabNavigation() && uih_currentTabId === "#PHOTOS") {
                if (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "image") {
                    const p = uih_currentProperties[0];
                    if (p.value === ((_c = p.validation) === null || _c === void 0 ? void 0 : _c.defaultValue)) {
                    }
                }
            }
            if (renderPhotoTabForEmptyImage) {
                container.appendChild(getPropertiesTitle(printess));
                renderTabNavigationProperties(printess, container, false);
            }
            else {
                if (printess.showTabNavigation()) {
                    container.appendChild(getPropertiesTitle(printess));
                }
                if (state === "text") {
                    const infoText = document.createElement("p");
                    infoText.textContent = printess.gl("ui.editTextInsideFrame");
                    if (!printess.showTabNavigation())
                        infoText.style.padding = "30px";
                    container.appendChild(infoText);
                }
                const props = getProperties(printess, state, properties, container);
                t = t.concat(props);
            }
            if (properties.length === 0) {
                if (!printess.showTabNavigation()) {
                    container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
                }
            }
            else if (renderPhotoTabForEmptyImage || (printess.showTabNavigation() && printess.stepHeaderDisplay() === "tabs list")) {
            }
            else {
                if (printess.hasSteps() || !printess.showTabNavigation()) {
                    const hr = document.createElement("hr");
                    container.appendChild(hr);
                }
                container.appendChild(getDoneButton(printess));
            }
        }
        return t;
    }
    function getProperties(printess, state = uih_currentState, properties, propsDiv) {
        const t = [];
        let controlGroup = 0;
        let controlGroupDiv = null;
        let controlGroupTCs = "";
        let colorsContainer = null;
        for (const p of properties) {
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
                colorsContainer.appendChild(getPropertyControl(printess, p));
            }
            else {
                colorsContainer = null;
                if (controlGroupDiv && p.controlGroup === controlGroup) {
                    controlGroupTCs += getControlGroupWidth(p);
                    controlGroupDiv.appendChild(getPropertyControl(printess, p));
                }
                else {
                    if (controlGroupDiv) {
                        propsDiv.appendChild(controlGroupDiv);
                        controlGroupDiv.style.gridTemplateColumns = controlGroupTCs;
                        controlGroupDiv = null;
                        controlGroup = 0;
                    }
                    if (p.controlGroup) {
                        controlGroup = p.controlGroup;
                        controlGroupDiv = document.createElement("div");
                        controlGroupDiv.className = "control-group";
                        controlGroupTCs = getControlGroupWidth(p);
                        controlGroupDiv.appendChild(getPropertyControl(printess, p));
                    }
                    else {
                        propsDiv.appendChild(getPropertyControl(printess, p));
                    }
                }
            }
        }
        if (controlGroupDiv) {
            propsDiv.appendChild(controlGroupDiv);
            controlGroupDiv.style.gridTemplateColumns = controlGroupTCs;
            controlGroupDiv = null;
            controlGroup = 0;
        }
        return t;
    }
    function getControlGroupWidth(p) {
        var _a, _b;
        if (p.kind === "label") {
            return "auto";
        }
        else if ((_a = p.validation) === null || _a === void 0 ? void 0 : _a.maxChars) {
            return ((_b = p.validation) === null || _b === void 0 ? void 0 : _b.maxChars) + "fr ";
        }
        else if (p.listMeta && p.listMeta.list.length > 0) {
            let c = 1;
            for (const itm of p.listMeta.list) {
                c = c < itm.label.length ? itm.label.length : c;
            }
            return (c) + "fr ";
        }
        else {
            return "10fr ";
        }
    }
    function getBuyerOverlayType(printess, properties) {
        const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
        const isImage = properties.filter(p => p.kind === "image").length > 0;
        const isColor = properties.filter(p => p.kind === "color").length > 0;
        const isStory = properties.filter(p => p.kind === "multi-line-text" || p.kind === "selection-text-style").length > 0;
        const hasFont = properties.filter(p => p.kind === "font").length > 0;
        const isText = hasFont || isSingleLineText || isStory || properties.length === 0;
        if (isText && isImage) {
            return printess.gl("ui.tabStickers");
        }
        else if (isText) {
            return printess.gl("ui.textFrame");
        }
        else if (isImage) {
            return printess.gl("ui.photoFrame");
        }
        else if (isColor) {
            return printess.gl("ui.color");
        }
        return "Sticker";
    }
    function getDesktopTabsContainer(printessDesktopGrid) {
        let tabsContainer = document.querySelector("div.tabs-navigation");
        if (!tabsContainer) {
            tabsContainer = document.createElement("div");
            tabsContainer.className = "tabs-navigation";
            printessDesktopGrid.appendChild(tabsContainer);
        }
        return tabsContainer;
    }
    function removeDesktopTabsContainer() {
        const tabsContainer = document.querySelector("div.tabs-navigation");
        if (tabsContainer && tabsContainer.parentElement) {
            tabsContainer.parentElement.removeChild(tabsContainer);
        }
    }
    function adjustDesktopView(printess, desktopTitleOrSteps, propsContainer, printessDiv, state) {
        var _a;
        if (printess.showTabNavigation()) {
            if (printess.hasPreviewBackButton()) {
                printessDiv.classList.add("preview-grid");
                propsContainer.style.display = "none";
            }
            else {
                printessDiv.classList.remove("preview-grid");
                propsContainer.style.display = "flex";
                propsContainer.style.height = "100%";
            }
            if (uih_currentTabId === "LOADING" || (uih_currentTabId === "#PHOTOS" && !printess.showPhotoTab())) {
                uih_currentTabId = printess.getInitialTabId();
            }
            const printessDesktopGrid = document.getElementById("printess-desktop-grid");
            if (printessDesktopGrid) {
                printessDesktopGrid.classList.add("main-tabs");
                if (printess.stepHeaderDisplay() !== "tabs list" && printess.pageNavigationDisplay() !== "icons") {
                    printessDesktopGrid.appendChild(desktopTitleOrSteps);
                }
                else {
                    const desktopTitle = document.querySelector("div.desktop-title-or-steps");
                    if (desktopTitle)
                        printessDesktopGrid.removeChild(desktopTitle);
                }
                const tabsContainer = getDesktopTabsContainer(printessDesktopGrid);
                const isBackgroundSelected = printess.isBackgroundSelected();
                if (isBackgroundSelected) {
                    uih_currentTabId = "#BACKGROUND";
                }
                else {
                    if (uih_currentTabId === "#BACKGROUND") {
                        uih_currentTabId = "#NONE";
                    }
                    if (uih_currentTabId === "#NONE" && (state === "document" || uih_currentProperties.length === 0)) {
                        uih_currentTabId = printess.getInitialTabId();
                    }
                    if (state === "document" && uih_currentTabId === "#NONE") {
                        if (uih_currentProperties.length) {
                            uih_currentTabId = "#FORMFIELDS";
                        }
                        else {
                            uih_currentTabId = printess.getInitialTabId();
                        }
                    }
                    if (state === "text" || (state === "frames" && uih_currentProperties.length)) {
                        uih_currentTabId = "#NONE";
                    }
                    if (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "image") {
                        const p = uih_currentProperties[0];
                        if (p.value === ((_a = p.validation) === null || _a === void 0 ? void 0 : _a.defaultValue)) {
                        }
                    }
                }
                renderTabsNavigation(printess, tabsContainer, false);
            }
        }
        else {
            removeDesktopTabsNavigation();
        }
    }
    function removeDesktopTabsNavigation() {
        const printessDesktopGrid = document.getElementById("printess-desktop-grid");
        if (printessDesktopGrid === null || printessDesktopGrid === void 0 ? void 0 : printessDesktopGrid.classList.contains("main-tabs")) {
            printessDesktopGrid.classList.remove("main-tabs");
            removeDesktopTabsContainer();
            const desktopTitle = document.querySelector(".desktop-title-or-steps");
            if (desktopTitle === null || desktopTitle === void 0 ? void 0 : desktopTitle.parentElement) {
                desktopTitle.parentElement.removeChild(desktopTitle);
            }
        }
    }
    function getSelectedTab() {
        return uih_currentTabs.filter(t => t.id === uih_currentTabId)[0] || null;
    }
    function selectTab(printess, newTabId = "") {
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
    function getPropertiesTitle(printess) {
        const currentTab = uih_currentTabs.filter(t => t.id === uih_currentTabId)[0] || "";
        const hasFormFieldTab = uih_currentTabs.filter(t => t.id === "#FORMFIELDS").length > 0;
        const titleDiv = document.createElement("div");
        titleDiv.className = "properties-title";
        if (!hasFormFieldTab && uih_currentTabId !== "#FORMFIELDS" && printess.hasFormFields()) {
            const icon = printess.getIcon("arrow-left");
            const backButton = document.createElement("button");
            backButton.className = "btn btn-sm btn-outline-primary";
            backButton.onclick = () => {
                selectTab(printess, "#FORMFIELDS");
                printess.clearSelection();
            };
            backButton.appendChild(icon);
            titleDiv.appendChild(backButton);
            titleDiv.classList.remove("only-title");
        }
        else {
            titleDiv.classList.add("only-title");
        }
        const title = document.createElement("h3");
        let caption = "";
        if (uih_currentState === "text") {
            caption = printess.gl("ui.textFrame");
        }
        else if (uih_currentState === "frames") {
            caption = getBuyerOverlayType(printess, uih_currentProperties);
        }
        else if (currentTab) {
            caption = currentTab.head || currentTab.caption;
        }
        title.textContent = caption.replace(/\\n/g, "");
        titleDiv.appendChild(title);
        return titleDiv;
    }
    function renderTabsNavigation(printess, tabsContainer, forMobile) {
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
            if (t.id === "#PHOTOS" && !printess.showPhotoTab())
                continue;
            if (forMobile && (t.id === "#BACKGROUND" || t.id === "#FORMFIELDS"))
                continue;
            const tabItem = document.createElement("li");
            tabItem.className = "nav-item";
            tabItem.dataset.tabid = t.id;
            if ((selected === null || selected === void 0 ? void 0 : selected.id) === t.id) {
                tabItem.classList.add("selected");
            }
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
                    printess.selectBackground();
                }
                else if (t.id === "#FORMFIELDS") {
                    printess.clearSelection();
                }
                else {
                    printess.clearSelection();
                }
            };
            const tabIcon = printess.getIcon(t.icon);
            tabIcon.classList.add("desktop-tab-icon");
            const tabLink = document.createElement("a");
            tabLink.className = "nav-link " + ((selected === null || selected === void 0 ? void 0 : selected.id) === t.id ? "active" : "");
            tabLink.innerHTML = t.caption.replace(/\\n/g, "<br>");
            tabItem.appendChild(tabIcon);
            if (forMobile || tabsContainer.clientHeight / tabs.length > 100) {
                tabItem.appendChild(tabLink);
            }
            else {
                tabIcon.style.marginBottom = "10px";
            }
            tabsToolbar.appendChild(tabItem);
        }
        tabsContainer.appendChild(tabsToolbar);
    }
    function renderTabNavigationProperties(printess, container, forMobile) {
        switch (uih_currentTabId) {
            case "#PHOTOS": {
                const tabs = [{ title: printess.gl("ui.selectImage"), id: "select-images", content: renderMyImagesTab(printess, forMobile, undefined, undefined, undefined, printess.showSearchBar(), true) }];
                const groupSnippets = uih_currentGroupSnippets.filter(gs => gs.tabId === "#PHOTOS");
                if (groupSnippets.length) {
                    tabs.push({ title: printess.gl("ui.addPhotoFrame"), id: "photo-frames", content: renderGroupSnippets(printess, groupSnippets, forMobile) });
                    container.appendChild(getTabPanel(tabs, "photo-frames"));
                    container.scrollTop = uih_snippetsScrollPosition;
                }
                else {
                    container.appendChild(renderMyImagesTab(printess, forMobile, undefined, undefined, undefined, printess.showSearchBar(), true));
                }
                break;
            }
            case "#LAYOUTS": {
                const layoutsDiv = renderLayoutSnippets(printess, uih_currentLayoutSnippets, forMobile);
                container.appendChild(layoutsDiv);
                container.scrollTop = uih_snippetsScrollPosition;
                break;
            }
            case "#BACKGROUND": {
                printess.selectBackground();
                break;
            }
            case "#FORMFIELDS": {
                break;
            }
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
    function getPropertyControl(printess, p, metaProperty, forMobile = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        switch (p.kind) {
            case "label":
                return getSimpleLabel(p.label, p.controlGroup > 0);
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
                            return getFontDropDown(printess, p, true);
                        case "text-style-hAlign":
                            return getHAlignControl(printess, p, true);
                        case "text-style-size":
                            return getFontSizeDropDown(printess, p, true);
                        case "text-style-vAlign":
                            return getVAlignControl(printess, p, true);
                        case "text-style-vAlign-hAlign":
                            return getVAlignAndHAlignControl(printess, p, true);
                        case "handwriting-image":
                            return getImageUploadControl(printess, p, undefined, forMobile);
                        default:
                            return getMultiLineTextBox(printess, p, forMobile);
                    }
                }
                else if (p.kind === "selection-text-style") {
                    return getInlineTextStyleControl(printess, p);
                }
                else {
                    return getMultiLineTextBox(printess, p, forMobile);
                }
            case "color":
                if (forMobile === false && uih_currentProperties.length <= 3 && uih_currentProperties.filter(p => p.kind === "color").length <= 1) {
                    return getTextPropertyScrollContainer(getColorDropDown(printess, p, undefined, true));
                }
                else if (!forMobile && uih_currentProperties.length === 2 && uih_currentProperties.filter(p => p.kind === "color").length === 2 && printess.enableCustomColors()) {
                    const colorsContainer = getTextPropertyScrollContainer(getColorDropDown(printess, p, undefined, true));
                    colorsContainer.classList.add("mb-4");
                    return colorsContainer;
                }
                else {
                    return getColorDropDown(printess, p, undefined, forMobile);
                }
            case "number":
                return getNumberSlider(printess, p);
            case "image-id":
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
                }
                else {
                    const tabs = [];
                    if ((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.canUpload) {
                        tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) });
                    }
                    else {
                        tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTabSelect"), content: getImageUploadControl(printess, p) });
                    }
                    if (((_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.canUpload) && p.value !== ((_c = p.validation) === null || _c === void 0 ? void 0 : _c.defaultValue)) {
                        tabs.push({ id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p, forMobile) });
                        if ((_d = p.imageMeta) === null || _d === void 0 ? void 0 : _d.hasFFCropEditor) {
                            tabs.push({ id: "crop-" + p.id, title: printess.gl("ui.cropTab"), content: getImageCropControl(printess, p, false, !forMobile) });
                        }
                    }
                    return getTabPanel(tabs, p.id);
                }
            case "image": {
                if (forMobile) {
                    if (metaProperty) {
                        switch (metaProperty) {
                            case "image-contrast":
                                return getNumberSlider(printess, p, metaProperty, true);
                            case "image-sepia":
                            case "image-brightness":
                            case "image-hueRotate":
                            case "image-vivid":
                                return getNumberSlider(printess, p, metaProperty, true);
                            case "image-invert":
                                return getInvertImageChecker(printess, p, "image-invert", forMobile);
                            case "image-placement":
                                return getImagePlacementControl(printess, p, forMobile);
                            case "image-scale":
                                {
                                    const div = document.createElement("div");
                                    const s = getImageScaleControl(printess, p, true);
                                    if (forMobile && s && ((_e = p.imageMeta) === null || _e === void 0 ? void 0 : _e.canSetPlacement)) {
                                        div.appendChild(getImagePlacementControl(printess, p, forMobile));
                                        div.appendChild(s);
                                        return div;
                                    }
                                    if (!s)
                                        return document.createElement("div");
                                    return s;
                                }
                            case "image-rotation":
                                return getImageRotateControl(printess, p, forMobile);
                            case "image-filter":
                                {
                                    const tags = (_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.filterTags;
                                    if (tags && tags.length > 0) {
                                        return getImageFilterButtons(printess, p, tags);
                                    }
                                }
                                break;
                        }
                        const d = document.createElement("div");
                        d.innerText = printess.gl("ui.missingControl");
                        return d;
                    }
                    else {
                        return getImageUploadControl(printess, p, undefined, forMobile);
                    }
                }
                const tabs = [];
                if ((_g = p.imageMeta) === null || _g === void 0 ? void 0 : _g.canUpload) {
                    tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) });
                }
                else {
                    const title = ((_h = p.imageMeta) === null || _h === void 0 ? void 0 : _h.isHandwriting) ? printess.gl("ui.imageTabHandwriting") : printess.gl("ui.imageTabSelect");
                    tabs.push({ id: "upload-" + p.id, title: title, content: getImageUploadControl(printess, p) });
                }
                if (((_j = p.imageMeta) === null || _j === void 0 ? void 0 : _j.canUpload) && p.value !== ((_k = p.validation) === null || _k === void 0 ? void 0 : _k.defaultValue)) {
                    if (((_l = p.imageMeta) === null || _l === void 0 ? void 0 : _l.allows.length) > 2 && p.value !== ((_m = p.validation) === null || _m === void 0 ? void 0 : _m.defaultValue)) {
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
    function getSimpleLabel(text, forControlGroup = false) {
        if (forControlGroup) {
            const para = document.createElement("para");
            para.style.marginTop = "38px";
            para.style.marginBottom = "0";
            para.style.marginLeft = "5px";
            para.style.fontSize = "16pt";
            para.textContent = text;
            return para;
        }
        else {
            const para = document.createElement("p");
            para.className = "mb-1";
            para.textContent = text;
            return para;
        }
    }
    function getChangeBackgroundButton(printess) {
        const ok = document.createElement("button");
        ok.className = "btn btn-primary w-100 align-self-start mb-3";
        ok.innerText = printess.gl("ui.buttonChangeBackground");
        ok.onclick = () => {
            printess.selectBackground();
        };
        return ok;
    }
    function getDesktopNavButton(btn) {
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.style.marginRight = "4px";
        ok.style.alignSelf = "start";
        ok.style.padding = "5px";
        ok.textContent = btn.text;
        ok.onclick = () => btn.task();
        return ok;
    }
    function getDoneButton(printess) {
        const buttons = {
            previous: {
                name: "previous",
                text: printess.gl("ui.buttonPrevStep"),
                task: () => {
                    var _a;
                    printess.previousStep();
                    getCurrentTab(printess, (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) - 1), true);
                }
            },
            next: {
                name: "next",
                text: printess.gl("ui.buttonNext"),
                task: () => {
                    var _a;
                    gotoNextStep(printess);
                    getCurrentTab(printess, (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) + 1), true);
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
        };
        const container = document.createElement("div");
        if (printess.isCurrentStepActive()) {
            if (printess.hasPreviousStep()) {
                container.appendChild(getDesktopNavButton(buttons.previous));
            }
            if (printess.hasNextStep()) {
                container.appendChild(getDesktopNavButton(buttons.next));
            }
            else {
                container.appendChild(getDesktopNavButton(buttons.basket));
            }
        }
        else if (!printess.isCurrentStepActive() && printess.hasSteps()) {
            container.appendChild(getDesktopNavButton(buttons.done));
            if (printess.hasNextStep()) {
                container.appendChild(getDesktopNavButton(buttons.next));
            }
            else {
                container.appendChild(getDesktopNavButton(buttons.basket));
            }
        }
        else if (!printess.showTabNavigation()) {
            container.appendChild(getDesktopNavButton(buttons.done));
        }
        return container;
    }
    function getFormTextStyleControl(printess, p) {
        const textPropertiesDiv = document.createElement("div");
        textPropertiesDiv.classList.add("mb-3");
        if (!p.textStyle) {
            return textPropertiesDiv;
        }
        const group1 = document.createElement("div");
        group1.className = "input-group mb-3";
        const pre1 = document.createElement("div");
        pre1.className = "input-group-prepend";
        if (p.textStyle.allows.indexOf("color") >= 0) {
            getColorDropDown(printess, p, "color", false, pre1);
        }
        if (p.textStyle.allows.indexOf("size") >= 0) {
            getFontSizeDropDown(printess, p, false, pre1, false);
        }
        group1.appendChild(pre1);
        if (p.textStyle.allows.indexOf("font") >= 0) {
            getFontDropDown(printess, p, false, group1, false);
        }
        textPropertiesDiv.appendChild(group1);
        textPropertiesDiv.appendChild(getTextAlignmentControl(printess, p));
        return textPropertiesDiv;
    }
    function getInlineTextStyleControl(printess, p) {
        const textPropertiesDiv = document.createElement("div");
        textPropertiesDiv.classList.add("mb-3");
        if (!p.textStyle) {
            return textPropertiesDiv;
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
    function getTextPropertyScrollContainer(child) {
        const d = document.createElement("div");
        d.className = "mb-3 text-large-properties";
        d.appendChild(child);
        return d;
    }
    function getTextAlignmentControl(printess, p) {
        const group2 = document.createElement("div");
        if (p.textStyle && (p.textStyle.allows.indexOf("horizontalAlignment") >= 0 || p.textStyle.allows.indexOf("verticalAlignment"))) {
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
    function getMultiLineTextBox(printess, p, forMobile) {
        const ta = getTextArea(printess, p, forMobile);
        if (forMobile) {
            return ta;
        }
        else {
            const container = document.createElement("div");
            container.appendChild(getFormTextStyleControl(printess, p));
            container.appendChild(ta);
            return container;
        }
    }
    function getSingleLineTextBox(printess, p, forMobile) {
        var _a;
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = p.value.toString();
        inp.autocomplete = "off";
        inp.autocapitalize = "off";
        inp.spellcheck = false;
        if (p.validation && p.validation.maxChars) {
            inp.maxLength = p.validation.maxChars;
        }
        inp.oninput = () => {
            printess.setProperty(p.id, inp.value).then(() => setPropertyVisibilities(printess));
            p.value = inp.value;
            validate(printess, p);
            const mobileButtonDiv = document.getElementById(p.id + ":");
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
            }
        };
        inp.onfocus = () => {
            const ffId = p.id.startsWith("FF_") ? p.id.substr(3) : undefined;
            printess.setZoomMode("frame");
            printess.resizePrintess(false, undefined, undefined, undefined, ffId);
            if (inp.value && p.validation && p.validation.clearOnFocus && inp.value === p.validation.defaultValue) {
                inp.value = "";
            }
            else {
                window.setTimeout(() => inp.select(), 0);
            }
        };
        inp.onblur = () => {
            printess.setZoomMode("spread");
        };
        const r = addLabel(printess, inp, p.id, forMobile, p.kind, p.label, !!((_a = p.validation) === null || _a === void 0 ? void 0 : _a.maxChars) && p.controlGroup === 0, p.controlGroup > 0);
        return r;
    }
    function getDesktopTitle(printess) {
        const container = document.createElement("div");
        const forCornerTools = printess.pageNavigationDisplay() === "icons";
        const basketBtnBehaviour = printess.getBasketButtonBehaviour();
        const inner = document.createElement("div");
        inner.className = "desktop-title-bar";
        if (!printess.showTabNavigation()) {
            inner.classList.add("mb-2");
        }
        else {
            inner.style.alignItems = "center";
        }
        if (!forCornerTools) {
            const h3 = document.createElement("h3");
            h3.innerText = printess.gl(printess.getTemplateTitle());
            h3.style.margin = "0px";
            inner.appendChild(h3);
            const priceDiv = document.createElement("div");
            priceDiv.className = "total-price-container";
            priceDiv.id = "total-price-display";
            if (uih_currentPriceDisplay)
                getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
            inner.appendChild(priceDiv);
        }
        if (printess.hasPreviewBackButton()) {
            inner.appendChild(getPreviewBackButton(printess));
        }
        else if (basketBtnBehaviour === "go-to-preview") {
            const previewBtn = document.createElement("button");
            previewBtn.className = "btn btn-outline-primary";
            if (printess.showTabNavigation() && printess.pageNavigationDisplay() !== "icons") {
                previewBtn.classList.add("ms-1");
            }
            else {
                previewBtn.classList.add("me-1");
            }
            previewBtn.innerText = printess.gl("ui.buttonPreview");
            previewBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                if (validateAllInputs(printess) === true) {
                    yield printess.gotoNextPreviewDocument(0);
                    if (printess.showTabNavigation()) {
                        printess.resizePrintess();
                    }
                }
            });
            inner.appendChild(previewBtn);
        }
        else {
            inner.appendChild(document.createElement("div"));
        }
        const basketBtn = document.createElement("button");
        const caption = printess.gl("ui.buttonBasket");
        basketBtn.className = "btn btn-primary";
        basketBtn.innerText = caption;
        const icon = printess.gl("ui.buttonBasketIcon");
        if (icon) {
            const svg = printess.getIcon(icon);
            svg.style.height = "24px";
            svg.style.float = "left";
            svg.style.marginRight = caption ? "10px" : "0px";
            basketBtn.appendChild(svg);
        }
        basketBtn.onclick = () => addToBasket(printess);
        inner.appendChild(basketBtn);
        container.appendChild(inner);
        if (!forCornerTools && !printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
            const hr = document.createElement("hr");
            container.appendChild(hr);
        }
        return container;
    }
    function getPreviewBackButton(printess) {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary";
        if (printess.showTabNavigation() && printess.pageNavigationDisplay() !== "icons") {
            btn.classList.add("ms-1");
        }
        else {
            btn.classList.add("me-1");
        }
        const svg = printess.getIcon("arrow-left");
        svg.style.width = "18px";
        svg.style.verticalAlign = "sub";
        btn.appendChild(svg);
        btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
            yield printess.gotoPreviousPreviewDocument(0);
            if (printess.showTabNavigation()) {
                printess.resizePrintess();
            }
        });
        return btn;
    }
    function getExpertModeButton(printess, forMobile) {
        const btn = document.createElement("button");
        btn.id = "expert-button";
        if (printess.pageNavigationDisplay() === "icons") {
            btn.className = "btn me-1 button-with-caption";
        }
        else if (forMobile) {
            btn.className = "btn me-2 button-mobile-with-caption";
        }
        else {
            btn.className = "btn me-2 button-with-caption";
        }
        if (printess.isInExpertMode()) {
            const btnClass = forMobile ? "btn-light" : "btn-primary";
            btn.classList.add(btnClass);
        }
        else {
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
                }
                else {
                    btn.classList.remove("btn-primary");
                    btn.classList.add("btn-outline-primary");
                }
            }
            else {
                printess.enterExpertMode();
                if (forMobile) {
                    btn.classList.add("btn-light");
                    btn.classList.remove("btn-outline-light");
                }
                else {
                    btn.classList.add("btn-primary");
                    btn.classList.remove("btn-outline-primary");
                }
            }
        };
        return btn;
    }
    function getValidationOverlay(printess, errors, buttonType, stepIndex) {
        const error = errors[0];
        const modal = document.createElement("div");
        modal.id = "validation-modal";
        modal.className = "modal show align-items-center";
        modal.setAttribute("tabindex", "-1");
        modal.style.backgroundColor = "rgba(0,0,0,0.7)";
        modal.style.display = "flex";
        const dialog = document.createElement("div");
        dialog.className = "modal-dialog";
        const content = document.createElement("div");
        content.className = "modal-content";
        const modalHeader = document.createElement("div");
        modalHeader.className = "modal-header bg-primary";
        const title = document.createElement("h3");
        title.className = "modal-title";
        title.innerHTML = printess.gl(`errors.${error.errorCode}Title`).replace(/\n/g, "<br>");
        title.style.color = "#fff";
        const modalBody = document.createElement("div");
        modalBody.className = "modal-body";
        const footer = document.createElement("div");
        footer.className = "modal-footer";
        const ignore = document.createElement("button");
        ignore.className = "btn btn-outline-primary";
        ignore.textContent = printess.gl("ui.buttonIgnore");
        ignore.onclick = () => __awaiter(this, void 0, void 0, function* () {
            modal.style.display = "none";
            uih_ignoredLowResolutionErrors.push(error.boxIds[0]);
            modal.remove();
            errors.shift();
            if (errors.length > 0) {
                getValidationOverlay(printess, errors, buttonType, stepIndex);
                return;
            }
            if (stepIndex && buttonType === "next") {
                gotoStep(printess, stepIndex);
            }
            else if (printess.hasNextStep() && buttonType === "next") {
                gotoNextStep(printess);
            }
            else if (printess.getBasketButtonBehaviour() === "go-to-preview") {
                if (validateAllInputs(printess) === true) {
                    yield printess.gotoNextPreviewDocument(0);
                    if (printess.showTabNavigation()) {
                        printess.resizePrintess();
                    }
                }
            }
            else if (buttonType === "validateAll") {
                addToBasket(printess);
            }
            else {
                printess.clearSelection();
            }
        });
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.textContent = printess.gl("ui.buttonOk");
        ok.onclick = () => {
            printess.bringErrorIntoView(error);
            modal.style.display = "none";
            modal.remove();
        };
        const p = document.createElement("p");
        p.className = "error-message";
        p.textContent = `${printess.gl(`errors.${error.errorCode}`, error.errorValue1)}`;
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
            item.textContent = printess.gl(errorText, errors[i].errorValue1);
            editBtn.style.width = "20px";
            editBtn.style.marginLeft = "10px";
            editBtn.style.cursor = "pointer";
            editBtn.onclick = () => {
                printess.bringErrorIntoView(errors[i]);
                modal.style.display = "none";
                modal.remove();
            };
            item.appendChild(editBtn);
            errorList.appendChild(item);
        }
        modalHeader.appendChild(title);
        modalBody.appendChild(p);
        if (errors.length > 1) {
            let showErrorList = false;
            modalBody.appendChild(errorLink);
            svg.onclick = () => {
                showErrorList = !showErrorList;
                if (showErrorList) {
                    modalBody.appendChild(errorList);
                    svg.style.transform = "rotate(180deg)";
                }
                else if (!showErrorList && errorList) {
                    modalBody.removeChild(errorList);
                    svg.style.transform = "rotate(0deg)";
                }
            };
        }
        if (error.errorCode === "imageResolutionLow" || error.errorCode === "emptyBookPage") {
            footer.appendChild(ignore);
        }
        footer.appendChild(ok);
        content.appendChild(modalHeader);
        content.appendChild(modalBody);
        content.appendChild(footer);
        dialog.appendChild(content);
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    }
    function getDesktopStepsUi(printess) {
        var _a, _b;
        const container = document.createElement("div");
        const hr = document.createElement("hr");
        if (!printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
            container.appendChild(hr);
        }
        const grid = document.createElement("div");
        grid.className = "desktop-title-bar mb-2";
        const cur = printess.getStep();
        const hd = printess.stepHeaderDisplay();
        if (cur && printess.isCurrentStepActive() && hd !== "never") {
            if (hd === "only title" || hd === "title and badge") {
                grid.classList.add("active-step");
                if (hd === "only title") {
                    grid.appendChild(document.createElement("div"));
                }
                else {
                    grid.appendChild(getStepBadge((cur.index + 1).toString()));
                }
                const h2 = document.createElement("h2");
                h2.style.flexGrow = "1";
                h2.className = "mb-0";
                h2.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
                grid.appendChild(h2);
            }
            else if (hd === "badge list" || hd === "tabs list") {
                grid.classList.add("active-step");
                grid.appendChild(document.createElement("div"));
                const h2 = document.createElement("h2");
                h2.style.flexGrow = "1";
                h2.className = "mb-0";
                h2.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
                grid.appendChild(h2);
            }
            else {
                grid.classList.add("active-step-only-badge");
                grid.appendChild(document.createElement("div"));
            }
        }
        else {
            grid.classList.add("steps");
            const h2 = document.createElement("h2");
            h2.style.flexGrow = "1";
            h2.className = "mb-0";
            h2.innerText = printess.getTemplateTitle();
            grid.appendChild(h2);
        }
        if (hd === "only badge" && cur && printess.isCurrentStepActive()) {
            const div = document.createElement("div");
            div.className = "step-n-of";
            const text1 = document.createElement("h2");
            text1.innerText = printess.gl("ui.step");
            const badge = getStepBadge((cur.index + 1).toString());
            const text2 = document.createElement("h2");
            text2.innerText = printess.gl("ui.of");
            const badge2 = getStepBadge((((_b = (_a = printess.lastStep()) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0) + 1).toString());
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
        if (uih_currentPriceDisplay)
            getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
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
        }
        else {
            grid.appendChild(document.createElement("div"));
        }
        if (printess.hasNextStep()) {
            const nextStep = document.createElement("button");
            nextStep.className = "btn btn-outline-primary";
            if (printess.isNextStepPreview()) {
                nextStep.innerText = printess.gl("ui.buttonPreview");
            }
            else {
                const svg = printess.getIcon("arrow-right");
                svg.style.width = "18px";
                svg.style.verticalAlign = "sub";
                nextStep.appendChild(svg);
            }
            nextStep.onclick = () => gotoNextStep(printess);
            grid.appendChild(nextStep);
        }
        else {
            grid.appendChild(getStepsPutToBasketButton(printess));
        }
        container.appendChild(grid);
        if (!printess.showTabNavigation() && !printess.hasPreviewBackButton()) {
            container.appendChild(hr);
        }
        return container;
    }
    function getStepBadge(content) {
        const badge = document.createElement("div");
        badge.className = "step-badge";
        if (typeof content === "string") {
            badge.innerText = content;
        }
        else {
            badge.appendChild(content);
        }
        return badge;
    }
    function getCurrentTab(printess, value, forMobile = true) {
        if ((printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "badge list")) {
            const tabsListScrollbar = document.getElementById("tabs-list-scrollbar");
            const curStepTab = document.getElementById("tab-step-" + value);
            setTabScrollPosition(tabsListScrollbar, curStepTab, forMobile);
        }
    }
    function setTabScrollPosition(tabsListScrollbar, tab, forMobile) {
        const stepTabs = document.getElementById("step-tab-list");
        uih_stepTabsScrollPosition = tabsListScrollbar.scrollLeft;
        if (stepTabs && tab && stepTabs.offsetWidth / tab.offsetLeft < 2) {
            if (forMobile) {
                uih_stepTabOffset = tab.offsetLeft - (stepTabs.offsetWidth / 2) + (tab.clientWidth / 2);
            }
            else {
                uih_stepTabOffset = tab.offsetLeft - (stepTabs.offsetWidth / 2) + 40 + (tab.clientWidth / 2);
            }
        }
        else {
            uih_stepTabOffset = 0;
        }
    }
    function getStepsTabsList(printess, _forMobile = false, displayType) {
        var _a, _b, _c, _d;
        const div = document.createElement("div");
        div.className = "tabs-list";
        div.id = "tabs-list-scrollbar";
        const isDesktopTabs = (!_forMobile && displayType === "tabs list");
        const ul = document.createElement("ul");
        ul.className = "nav nav-tabs flex-nowrap " + (_forMobile ? "" : "step-tabs-desktop");
        if (displayType === "badge list")
            ul.style.borderBottomColor = "var(--bs-white)";
        if (displayType === "badge list" && _forMobile) {
            const prev = document.createElement("li");
            prev.className = "nav-item tab-item badge-item";
            const prevLink = document.createElement("a");
            prevLink.className = "nav-link badge-link prev-badge";
            if (!printess.hasPreviousStep())
                prevLink.classList.add("disabled");
            const icon = printess.getIcon("carret-left-solid");
            icon.style.width = "25px";
            icon.style.height = "25px";
            icon.style.paddingRight = "2px";
            prev.onclick = () => {
                var _a;
                const curStepTab = document.getElementById("tab-step-" + (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) - 1));
                setTabScrollPosition(div, curStepTab, _forMobile);
                printess.previousStep();
            };
            prevLink.appendChild(icon);
            prev.appendChild(prevLink);
            ul.appendChild(prev);
        }
        const cur = printess.getStep();
        if (cur) {
            for (let i = 0; i <= ((_b = (_a = printess.lastStep()) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0); i++) {
                const tab = document.createElement("li");
                tab.className = "nav-item " + (isDesktopTabs ? "" : "tab-item");
                if (displayType === "badge list")
                    tab.classList.add("badge-item");
                tab.id = "tab-step-" + i;
                const tabLink = document.createElement("a");
                tabLink.className = "nav-link text-truncate ";
                if (displayType === "badge list")
                    tabLink.classList.add("badge-link");
                if (cur.index === i) {
                    if (isDesktopTabs) {
                        tab.classList.add("active");
                        tabLink.classList.add("active");
                    }
                    else {
                        tab.classList.add("active-step-tab");
                        tabLink.classList.add("active-step-tablink");
                    }
                }
                else {
                    if (isDesktopTabs) {
                        tab.classList.remove("active");
                        tabLink.classList.remove("active");
                    }
                    else {
                        tab.classList.remove("active-step-tab");
                        tabLink.classList.remove("active-step-tab");
                    }
                }
                const stepTitle = (_d = (_c = printess.getStepByIndex(i)) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : "";
                tabLink.innerText = stepTitle.length === 0 || displayType === "badge list" ? (i + 1).toString() : stepTitle;
                tab.appendChild(tabLink);
                tab.onclick = () => __awaiter(this, void 0, void 0, function* () {
                    const comingFromPreview = printess.hasPreviewBackButton();
                    setTabScrollPosition(div, tab, _forMobile);
                    yield gotoStep(printess, i);
                    if (printess.hasPreviewBackButton()) {
                        printess.resizePrintess();
                    }
                    if (comingFromPreview) {
                        printess.resizePrintess();
                    }
                });
                ul.appendChild(tab);
            }
        }
        if (displayType === "badge list" && _forMobile) {
            const next = document.createElement("li");
            next.className = "nav-item tab-item badge-item";
            const nextLink = document.createElement("a");
            nextLink.className = "nav-link badge-link next-badge";
            if (!printess.hasNextStep())
                nextLink.classList.add("disabled");
            const icon = printess.getIcon("carret-right-solid");
            icon.style.width = "25px";
            icon.style.height = "25px";
            icon.style.paddingLeft = "2px";
            next.onclick = () => {
                var _a;
                const curStepTab = document.getElementById("tab-step-" + (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) + 1));
                setTabScrollPosition(div, curStepTab, _forMobile);
                printess.nextStep();
            };
            nextLink.appendChild(icon);
            next.appendChild(nextLink);
            ul.appendChild(next);
        }
        scrollToLeft(div, uih_stepTabOffset, 300, uih_stepTabsScrollPosition);
        div.appendChild(ul);
        return div;
    }
    function getStepsBadgeList(printess, _forMobile = false) {
        var _a, _b;
        const sm = "";
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
            }
            else {
                prevBadge.classList.add("disabled");
            }
            div.appendChild(prevBadge);
            for (let i = 0; i <= ((_b = (_a = printess.lastStep()) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0); i++) {
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
                nextBadge.onclick = () => gotoNextStep(printess);
                nextBadge.classList.add("selectable");
            }
            else {
                nextBadge.classList.add("disabled");
            }
            div.appendChild(nextBadge);
        }
        return div;
    }
    function getStepsPutToBasketButton(printess) {
        const basketButton = document.createElement("button");
        basketButton.className = "btn btn-primary";
        basketButton.innerText = printess.gl("ui.buttonBasket");
        basketButton.onclick = () => addToBasket(printess);
        return basketButton;
    }
    function getTextArea(printess, p, forMobile) {
        const inp = document.createElement("textarea");
        inp.value = p.value.toString();
        inp.autocomplete = "off";
        inp.rows = 6;
        inp.oninput = () => __awaiter(this, void 0, void 0, function* () {
            yield printess.setProperty(p.id, inp.value).then(() => setPropertyVisibilities(printess));
            p.value = inp.value;
            validate(printess, p);
            const mobileButtonDiv = document.getElementById(p.id + ":");
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
            }
        });
        inp.onfocus = () => {
            if (inp.value && p.validation && p.validation.clearOnFocus && inp.value === p.validation.defaultValue) {
                inp.value = "";
            }
            else {
                window.setTimeout(() => !printess.isIPhone() && inp.select(), 0);
            }
        };
        if (forMobile) {
            inp.className = "mobile-text-area";
            return addLabel(printess, inp, p.id, forMobile, p.kind, p.label);
        }
        else {
            inp.className = "desktop-text-area";
            return addLabel(printess, inp, p.id, forMobile, p.kind, p.label);
        }
    }
    function addLabel(printess, input, id, forMobile, kind, label, hasMaxChars = false, inControlGroup = false) {
        input.classList.add("form-control");
        const container = document.createElement("div");
        !forMobile && container.classList.add("mb-3");
        container.id = "cnt_" + id;
        container.style.display = printess.isPropertyVisible(id) ? "block" : "none";
        if (label) {
            if (label.trim() === "")
                label = "&nbsp;";
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
            }
            else if (kind === "image" && forMobile) {
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
            }
            else {
                container.appendChild(htmlLabel);
            }
        }
        input.id = "inp_" + id.replace("#", "-HASH-");
        container.appendChild(input);
        const validation = document.createElement("div");
        validation.id = "val_" + id;
        validation.classList.add("invalid-feedback");
        validation.innerText = printess.gl("errors.textMissingInline");
        if (kind !== "image")
            container.appendChild(validation);
        if (hasMaxChars)
            getCharValidationLabel(printess, id, container);
        return container;
    }
    function getCharValidationLabel(printess, id, container) {
        const validation = document.createElement("div");
        validation.id = "char_" + id;
        validation.className = "chars-remaining";
        validation.innerText = "";
        if (container)
            container.appendChild(validation);
    }
    function validate(printess, p) {
        if (p.validation) {
            const container = document.getElementById("cnt_" + p.id);
            const input = document.getElementById("inp_" + p.id.replace("#", "-HASH-"));
            const validation = document.getElementById("val_" + p.id);
            const charValidation = document.getElementById("char_" + p.id);
            if (charValidation && p.controlGroup === 0) {
                if (p.validation.maxChars && p.value.toString().length <= p.validation.maxChars && (p.value && p.value !== p.validation.defaultValue)) {
                    charValidation.innerText = printess.gl("errors.maxCharsLeftInline", p.validation.maxChars - p.value.toString().length);
                }
                else {
                    charValidation.innerText = "";
                }
            }
            if (container && input && validation) {
                if (p.validation.isMandatory && (!p.value || p.value === p.validation.defaultValue)) {
                    input.classList.add("is-invalid");
                    validation.innerText = printess.gl("errors.enterText");
                    return;
                }
                if (p.validation.maxChars) {
                    if (p.value.toString().length > p.validation.maxChars) {
                        input.classList.add("is-invalid");
                        validation.innerText = printess.gl("errors.maxCharsExceededInline", p.validation.maxChars);
                        return;
                    }
                }
                if (p.kind === "multi-line-text") {
                    window.setTimeout(() => {
                        uih_lastOverflowState = printess.hasTextOverflow(p.id);
                        if (uih_lastOverflowState) {
                            input.classList.add("is-invalid");
                            validation.innerText = printess.gl("errors.textOverflowShort");
                        }
                        else {
                            input.classList.remove("is-invalid");
                        }
                    }, 500);
                    if (uih_lastOverflowState) {
                        input.classList.add("is-invalid");
                        validation.innerText = printess.gl("errors.textOverflowShort");
                        return;
                    }
                }
                input.classList.remove("is-invalid");
            }
        }
        return;
    }
    function setPropertyVisibilities(printess) {
        for (const p of uih_currentProperties) {
            if (p.validation && p.validation.visibility !== "always") {
                const div = document.getElementById("cnt_" + p.id);
                if (div) {
                    const v = printess.isPropertyVisible(p.id);
                    if (v) {
                        if (div.style.display === "none") {
                            div.style.display = "block";
                        }
                    }
                    else {
                        div.style.display = "none";
                    }
                }
                else {
                    const div = document.getElementById(p.id + ":");
                    if (div) {
                        const v = printess.isPropertyVisible(p.id);
                        if (v) {
                            if (div.style.display === "none") {
                                if (div.classList.contains("mobile-property-text")) {
                                    div.style.display = "flex";
                                }
                                else {
                                    div.style.display = "grid";
                                }
                            }
                        }
                        else {
                            div.style.display = "none";
                        }
                    }
                }
            }
        }
    }
    function getImageSelectList(printess, p, forMobile) {
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
                if (entry.imageUrl) {
                    thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
                }
                else if (p.kind === "color-list") {
                    thumb.style.backgroundColor = entry.key;
                }
                thumb.style.width = p.listMeta.thumbWidth + "px";
                thumb.style.height = p.listMeta.thumbHeight + "px";
                if (entry.key === p.value)
                    thumb.classList.add("selected");
                thumb.onclick = () => {
                    printess.setProperty(p.id, entry.key).then(() => setPropertyVisibilities(printess));
                    imageList.childNodes.forEach((c) => c.classList.remove("selected"));
                    thumb.classList.add("selected");
                    p.value = entry.key;
                    const mobileButtonDiv = document.getElementById(p.id + ":");
                    if (mobileButtonDiv) {
                        drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                    }
                };
                imageList.appendChild(thumb);
            }
            container.appendChild(imageList);
        }
        if (forMobile) {
            return container;
        }
        else {
            return addLabel(printess, container, p.id, forMobile, p.kind, p.label);
        }
    }
    function hexToRgb(hexColor) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        return result ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : hexColor;
    }
    function getColorDropDown(printess, p, metaProperty, forMobile = false, dropdown) {
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.classList.add("btn-group");
        }
        const colors = printess.getColors(p.id);
        const button = document.createElement("button");
        const curColor = (metaProperty === "color" && p.textStyle) ? p.textStyle.color : p.value.toString();
        const curColorRgb = hexToRgb(curColor);
        if (!forMobile) {
            button.className = "btn btn-light dropdown-toggle btn-color-select";
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
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
                const colorInput = document.getElementById("hex-color-input_" + p.id);
                const hexColor = printess.getHexColor(f.color);
                if (colorInput && hexColor)
                    colorInput.value = hexColor;
                colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
                color.classList.add("selected");
                if (!forMobile) {
                    let redLine = document.getElementById("red-line-" + p.id);
                    if (redLine && f.color !== "transparent") {
                        redLine.remove();
                    }
                    else if (!redLine && f.color === "transparent") {
                        redLine = document.createElement("div");
                        redLine.id = "red-line-" + p.id;
                        redLine.className = "red-line-for-transparent-color";
                        redLine.style.width = "33px";
                        redLine.style.top = "18px";
                        button.appendChild(redLine);
                    }
                    button.style.backgroundColor = f.color;
                }
            };
            colorList.appendChild(color);
        }
        if (printess.enableCustomColors()) {
            colorList.appendChild(getCustomColorPicker(printess, p, forMobile, colorList, button, curColor, metaProperty));
        }
        if (forMobile) {
            return colorList;
        }
        else {
            ddContent.appendChild(colorList);
            dropdown.appendChild(ddContent);
            return dropdown;
        }
    }
    function setColor(printess, p, color, name, metaProperty) {
        return __awaiter(this, void 0, void 0, function* () {
            if (metaProperty === "color") {
                printess.setTextStyleProperty(p.id, metaProperty, name);
                const mobileButtonDiv = document.getElementById(p.id + ":color") || document.getElementById(p.id + ":text-style-color");
                if (mobileButtonDiv && p.textStyle) {
                    p.textStyle.color = color;
                    drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                }
            }
            else {
                yield printess.setProperty(p.id, name).then(() => setPropertyVisibilities(printess));
                p.value = color;
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                }
            }
        });
    }
    function getCustomColorPicker(printess, p, forMobile, colorList, button, curColor, metaProperty) {
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
            const colorInput = document.getElementById("hex-color-input_" + p.id);
            const color = colorInput === null || colorInput === void 0 ? void 0 : colorInput.value;
            if (color) {
                const colorItem = document.querySelector(`a[data-color='custom color_${p.id}']`);
                if (colorItem) {
                    colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
                    colorItem.classList.add("selected");
                    colorItem.style.backgroundColor = color;
                }
                setColor(printess, p, color, color, metaProperty);
                const redLine = document.getElementById("custom-red-line-picker-" + p.id);
                if (redLine)
                    redLine.remove();
                if (!forMobile) {
                    const buttonRedLine = document.getElementById("red-line-" + p.id);
                    if (buttonRedLine)
                        buttonRedLine.remove();
                    button.style.backgroundColor = color;
                }
            }
        };
        hexPicker.onclick = () => __awaiter(this, void 0, void 0, function* () {
            const colorInput = document.getElementById("hex-color-input_" + p.id);
            try {
                const eyeDropper = new EyeDropper();
                const { sRGBHex: color } = yield eyeDropper.open();
                if (color) {
                    colorInput.value = color;
                    const colorItem = document.querySelector(`a[data-color='custom color_${p.id}']`);
                    if (colorItem) {
                        colorList.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
                        colorItem.classList.add("selected");
                        colorItem.style.backgroundColor = color;
                    }
                    setColor(printess, p, color, color, metaProperty);
                    const redLine = document.getElementById("custom-red-line-picker-" + p.id);
                    if (redLine)
                        redLine.remove();
                    if (!forMobile) {
                        const buttonRedLine = document.getElementById("red-line-" + p.id);
                        if (buttonRedLine)
                            buttonRedLine.remove();
                        button.style.backgroundColor = color;
                    }
                }
            }
            catch (error) {
                alert("Sorry, eye-dropper tool is only available in Chrome Desktop.");
            }
        });
        hexPicker.appendChild(hexIcon);
        submitHex.appendChild(checkHex);
        hexGroup.appendChild(hexPicker);
        hexGroup.appendChild(hexInput);
        hexGroup.appendChild(submitHex);
        return hexGroup;
    }
    function getDropDown(printess, p, asList, fullWidth = true) {
        var _a;
        const dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
        if (p.controlGroup > 0 && asList)
            dropdown.classList.add("dropup");
        const ddContent = document.createElement("ul");
        if (p.listMeta && p.listMeta.list) {
            const selectedItem = (_a = p.listMeta.list.filter(itm => itm.key === p.value)[0]) !== null && _a !== void 0 ? _a : null;
            const button = document.createElement("button");
            button.className = "btn btn-light dropdown-toggle";
            if (fullWidth) {
                button.classList.add("full-width");
            }
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
            button.setAttribute("aria-expanded", "false");
            if (selectedItem) {
                button.appendChild(getDropdownItemContent(printess, p.listMeta, selectedItem));
            }
            dropdown.appendChild(button);
            if (asList) {
                ddContent.classList.add("list-group");
            }
            else {
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
                            drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                        }
                    });
                    if (p.listMeta) {
                        button.innerHTML = "";
                        button.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
                        if (asList) {
                            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                            li.classList.add("active");
                        }
                    }
                };
                a.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
                li.appendChild(a);
                ddContent.appendChild(li);
            }
            dropdown.appendChild(ddContent);
        }
        if (asList) {
            return ddContent;
        }
        else {
            return addLabel(printess, dropdown, p.id, false, p.kind, p.label, false, p.controlGroup > 0);
        }
    }
    function getDropdownItemContent(printess, meta, entry) {
        const div = document.createElement("div");
        div.classList.add("dropdown-list-entry");
        if (entry.imageUrl) {
            let tw = meta.thumbWidth;
            let th = meta.thumbHeight;
            const aspect = tw / th;
            if (th > 50) {
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
        return div;
    }
    function getTabPanel(tabs, id) {
        const panel = document.createElement("div");
        panel.id = "tabs-panel-" + id;
        const ul = document.createElement("ul");
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
                a.classList.add("active");
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
                pane.classList.add("show");
                pane.classList.add("active");
            }
            pane.appendChild(t.content);
            content.appendChild(pane);
        }
        panel.appendChild(ul);
        panel.appendChild(content);
        return panel;
    }
    function getImageFilterButtons(printess, p, tags) {
        const div = document.createElement("div");
        printess.getImageFilterSnippets(tags).then((snippets) => {
            const filters = document.createElement("div");
            filters.className = "d-flex flex-wrap mb-3";
            for (const sn of snippets) {
                const img = document.createElement("div");
                img.className = "image-filter-snippet m-1 position-relative border border-dark text-center";
                img.style.backgroundImage = "url('" + sn.thumbUrl + "')";
                img.onclick = () => {
                    printess.applyImageFilterSnippet(sn.snippetUrl);
                };
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
    function getImageFilterControl(printess, p, filterDiv, hasReset = true) {
        var _a, _b;
        const container = filterDiv || document.createElement("div");
        const tags = (_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.filterTags;
        if (tags && tags.length > 0) {
            container.appendChild(getImageFilterButtons(printess, p, tags));
        }
        (_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.allows.forEach(metaProperty => {
            switch (metaProperty) {
                case "brightness":
                    container.appendChild(getNumberSlider(printess, p, "image-brightness"));
                    break;
                case "contrast":
                    if (p.imageMeta && p.imageMeta.allows.indexOf("invert") >= 0) {
                        const d = document.createElement("div");
                        d.style.display = "grid";
                        d.style.gridTemplateColumns = "1fr auto";
                        d.appendChild(getNumberSlider(printess, p, "image-contrast", true));
                        d.appendChild(getInvertImageChecker(printess, p, "image-invert", false));
                        container.appendChild(d);
                    }
                    else {
                        container.appendChild(getNumberSlider(printess, p, "image-contrast"));
                    }
                    break;
                case "vivid":
                    container.appendChild(getNumberSlider(printess, p, "image-vivid"));
                    break;
                case "sepia":
                    container.appendChild(getNumberSlider(printess, p, "image-sepia"));
                    break;
                case "hueRotate":
                    container.appendChild(getNumberSlider(printess, p, "image-hueRotate"));
                    break;
                case "invert":
                    if (!p.imageMeta || p.imageMeta.allows.indexOf("contrast") === -1) {
                        container.appendChild(getInvertImageChecker(printess, p, "image-invert"));
                    }
                    break;
            }
        });
        if (hasReset) {
            const filterBtn = document.createElement("button");
            filterBtn.className = "btn btn-secondary mt-4 w-100";
            filterBtn.textContent = printess.gl("ui.buttonResetFilter");
            filterBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                if (p.imageMeta) {
                    p.imageMeta.brightness = 0;
                    p.imageMeta.sepia = 0;
                    p.imageMeta.hueRotate = 0;
                    p.imageMeta.contrast = 0;
                    p.imageMeta.vivid = 0;
                    p.imageMeta.invert = 0;
                    yield printess.resetImageFilters(p.id, p.imageMeta);
                }
                container.innerHTML = "";
                getImageFilterControl(printess, p, container);
            });
            container.appendChild(filterBtn);
        }
        return container;
    }
    function getImageRotateControl(printess, p, forMobile) {
        var _a;
        const container = document.createElement("div");
        if (p.imageMeta && p.value !== "fallback" && (p.value !== ((_a = p.validation) === null || _a === void 0 ? void 0 : _a.defaultValue))) {
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
                    printess.rotateImage(p.id, rotAngle).finally(() => {
                        imagePanel.innerHTML = "";
                    });
                    for (const c of [...imagePanel.childNodes]) {
                        if (c !== thumbDiv) {
                            c.style.opacity = "0.4";
                        }
                        else {
                            c.style.border = "2px solid red";
                        }
                    }
                };
                thumbDiv.style.transformOrigin = "50% 50%";
                thumbDiv.style.transform = "rotate(" + i * 90 + "deg)";
                imagePanel.appendChild(thumbDiv);
            }
            container.appendChild(imagePanel);
        }
        else {
            container.innerText = printess.gl("ui.selectImageFirst");
        }
        return container;
    }
    function hideModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            document.body.removeChild(modal);
        }
    }
    function showModal(printess, id, content, titelHtml, footer) {
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
        };
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
        if (footer)
            modalContent.appendChild(footer);
        dialog.appendChild(modalContent);
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    }
    function getImageCropControl(printess, p, showSkipBtn, forDesktopDialog = false) {
        const container = document.createElement("div");
        if (p.value) {
            const ui = printess.createCropUi(p.id, forDesktopDialog);
            if (!ui) {
                container.innerText = printess.gl("ui.selectImageFirst");
                return container;
            }
            ui.container.classList.add("mb-3");
            const rangeLabel = document.createElement("label");
            rangeLabel.id = "range-label";
            const range = document.createElement("input");
            range.className = "form-range";
            range.type = "range";
            range.min = "1";
            range.max = "5";
            range.step = "0.01";
            range.value = "1";
            const span = document.createElement("span");
            if (p.imageMeta) {
                span.textContent = printess.gl("ui.scale");
            }
            rangeLabel.appendChild(span);
            rangeLabel.appendChild(range);
            rangeLabel.classList.add("mb-3");
            range.oninput = () => {
                const newScale = parseFloat(range.value);
                ui.setScale(newScale);
            };
            const skipBtn = document.createElement("button");
            skipBtn.className = "btn btn-outline-primary mb-3 me-2";
            skipBtn.innerText = printess.gl("ui.buttonSkip");
            skipBtn.onclick = () => {
                hideModal("CROPMODAL");
            };
            const okBtn = document.createElement("button");
            okBtn.className = "btn btn-primary mb-3";
            okBtn.innerText = printess.gl("ui.applyChanges");
            okBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                const spinner = document.createElement("span");
                spinner.className = "spinner-border spinner-border-sm me-3";
                const spinnerText = document.createElement("span");
                spinnerText.textContent = printess.gl("ui.cropping");
                okBtn.textContent = "";
                okBtn.appendChild(spinner);
                okBtn.appendChild(spinnerText);
                okBtn.classList.add("disabled");
                yield printess.cropImage(p.id, ui.getCropBox());
                hideModal("CROPMODAL");
            });
            container.appendChild(rangeLabel);
            container.appendChild(ui.container);
            if (showSkipBtn) {
                container.appendChild(skipBtn);
            }
            container.appendChild(okBtn);
        }
        return container;
    }
    function getImageUploadControl(printess, p, container, forMobile = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        container = container || document.createElement("div");
        container.innerHTML = "";
        const imagePanel = document.createElement("div");
        imagePanel.className = "image-panel";
        imagePanel.id = "image-panel" + p.id;
        const images = printess.getImages(p.id);
        const imageList = document.createElement("div");
        if (forMobile || (uih_currentProperties.length < 5 && uih_currentProperties.filter(p => p.kind === "image" || p.kind === "image-id").length <= 1)) {
            if (!forMobile) {
                if (p.imageMeta && p.imageMeta.allows.length <= 2 && p.value !== ((_a = p.validation) === null || _a === void 0 ? void 0 : _a.defaultValue)) {
                    const filtersControl = getImageFilterControl(printess, p, undefined, false);
                    filtersControl.classList.add("mb-3");
                    container.appendChild(filtersControl);
                }
                const placementControl = getImagePlacementControl(printess, p, forMobile);
                if (placementControl && ((_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.canSetPlacement) && p.value !== ((_c = p.validation) === null || _c === void 0 ? void 0 : _c.defaultValue)) {
                    container.appendChild(placementControl);
                }
                const scaleControl = getImageScaleControl(printess, p);
                if (scaleControl) {
                    scaleControl.classList.add("mb-3");
                    container.appendChild(scaleControl);
                }
            }
            if (((_d = p.imageMeta) === null || _d === void 0 ? void 0 : _d.isHandwriting) === true) {
                const b = document.createElement("button");
                b.className = "btn btn-primary";
                b.innerText = "Back to text editing";
                b.onclick = () => {
                    printess.removeHandwritingImage();
                };
                imagePanel.appendChild(b);
            }
            else {
                if (forMobile) {
                    imagePanel.appendChild(renderImageControlButtons(printess, images, p));
                }
                else {
                    imagePanel.appendChild(renderMyImagesTab(printess, forMobile, p, images));
                }
            }
            imagePanel.style.gridTemplateRows = "auto";
            imagePanel.style.gridTemplateColumns = "1fr";
            container.appendChild(imagePanel);
            return container;
        }
        else {
            if ((_e = p.imageMeta) === null || _e === void 0 ? void 0 : _e.canUpload) {
                container.appendChild(getImageUploadButton(printess, p.id, forMobile, true));
            }
            const imageListWrapper = document.createElement("div");
            imageListWrapper.classList.add("image-list-wrapper");
            imageList.classList.add("image-list");
            const mainThumb = document.createElement("div");
            if ((_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.thumbCssUrl) {
                mainThumb.className = "main";
                mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
                imagePanel.appendChild(mainThumb);
            }
            for (const im of images) {
                const thumb = document.createElement("div");
                thumb.style.backgroundImage = im.thumbCssUrl;
                if (im.id === p.value)
                    thumb.style.border = "2px solid red";
                thumb.onclick = () => __awaiter(this, void 0, void 0, function* () {
                    const scaleHints = yield printess.setProperty(p.id, im.id);
                    p.value = im.id;
                    if (scaleHints && p.imageMeta) {
                        p.imageMeta.scaleHints = scaleHints;
                        p.imageMeta.scale = scaleHints.scale;
                        p.imageMeta.thumbCssUrl = im.thumbCssUrl;
                        p.imageMeta.thumbUrl = im.thumbUrl;
                        p.imageMeta.canScale = printess.canScale(p.id);
                    }
                    getImageUploadControl(printess, p, container, forMobile);
                    const propsDiv = document.getElementById("tabs-panel-" + p.id);
                    if (propsDiv) {
                        propsDiv.replaceWith(getPropertyControl(printess, p));
                    }
                    if (forMobile)
                        closeMobileFullscreenContainer();
                });
                imageList.appendChild(thumb);
            }
            imageListWrapper.appendChild(imageList);
            imagePanel.appendChild(imageListWrapper);
            if (forMobile) {
                container.classList.add("form-control");
                container.appendChild(imageList);
                return container;
            }
            else {
                container.appendChild(imagePanel);
                const placementControl = getImagePlacementControl(printess, p, forMobile);
                if (placementControl && ((_g = p.imageMeta) === null || _g === void 0 ? void 0 : _g.canSetPlacement) && p.value !== ((_h = p.validation) === null || _h === void 0 ? void 0 : _h.defaultValue)) {
                    container.appendChild(placementControl);
                }
                const scaleControl = getImageScaleControl(printess, p);
                if (scaleControl) {
                    container.appendChild(scaleControl);
                }
                return container;
            }
        }
    }
    function getImageUploadButton(printess, id, forMobile = false, assignToFrameOrNewFrame = true, label = "") {
        const container = document.createElement("div");
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
        inp.className = "form-control";
        inp.accept = `image/png,image/jpg,image/jpeg${printess.allowPdfUpload() ? ",application/pdf" : ""}`;
        inp.multiple = !id.startsWith("FF_");
        inp.style.display = "none";
        inp.onchange = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (inp && ((_a = inp.files) === null || _a === void 0 ? void 0 : _a.length)) {
                inp.disabled = true;
                inp.style.display = "none";
                const imageQualityInfoText = document.getElementById("image-quality-info");
                if (imageQualityInfoText)
                    imageQualityInfoText.style.display = "none";
                const scaleControl = document.getElementById("range-label");
                if (scaleControl)
                    scaleControl.style.display = "none";
                const twoButtons = document.getElementById("two-buttons");
                if (twoButtons)
                    twoButtons.style.gridTemplateColumns = "1fr";
                const distributeBtn = document.getElementById("distribute-button");
                if (distributeBtn)
                    distributeBtn.style.display = "none";
                const multipleImagesHint = document.getElementById("multiple-images-hint");
                if (multipleImagesHint)
                    multipleImagesHint.style.display = "none";
                const imageControl = document.getElementById("image-control-buttons");
                if (imageControl && forMobile) {
                    imageControl.innerHTML = "";
                    imageControl.style.gridTemplateColumns = "1fr";
                    imageControl.appendChild(progressDiv);
                }
                progressDiv.style.display = "flex";
                const label = document.getElementById("upload-btn-" + id);
                if (label) {
                    label.style.display = "none";
                }
                const newImg = yield printess.uploadImages(inp.files, (progress) => {
                    progressBar.style.width = (progress * 100) + "%";
                }, assignToFrameOrNewFrame, id);
                if (printess.getImages().length > 0 && printess.allowImageDistribution() && inp.files.length > 1) {
                    yield printess.distributeImages();
                }
                else if (!assignToFrameOrNewFrame && newImg && newImg.length > 0) {
                    printess.assignImageToNextPossibleFrame(newImg[0].id);
                }
                if (!assignToFrameOrNewFrame) {
                    const imageTabContainer = document.getElementById("tab-my-images");
                    if (imageTabContainer) {
                        imageTabContainer.innerHTML = "";
                        imageTabContainer.appendChild(renderMyImagesTab(printess, forMobile));
                    }
                }
                if (id.startsWith("FF_")) {
                    const p = uih_currentProperties.filter(p => p.id === id && p.kind === "image-id");
                    if (p.length > 0 && ((_b = p[0].imageMeta) === null || _b === void 0 ? void 0 : _b.hasFFCropEditor)) {
                        if (forMobile) {
                            renderMobileDialogFullscreen(printess, "CROPMODAL", "ui.buttonCrop", getImageCropControl(printess, p[0], true));
                        }
                        else {
                            showModal(printess, "CROPMODAL", getImageCropControl(printess, p[0], true, true), printess.gl("ui.buttonCrop"));
                        }
                    }
                }
                uih_activeImageAccordion = "Buyer Upload";
                if (printess.showTabNavigation()) {
                    closeMobileFullscreenContainer();
                }
            }
        });
        container.appendChild(progressDiv);
        container.appendChild(addLabel(printess, inp, id, forMobile, "image", label || "ui.changeImage"));
        return container;
    }
    function getImagePlacementControl(printess, p, forMobile, container) {
        var _a;
        const placementControls = [{
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
        }
        else {
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
            if (((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.placement) === pc.name) {
                button.classList.add("btn-primary");
            }
            else {
                button.classList.add("btn-outline-primary");
            }
            button.appendChild(icon);
            button.appendChild(txt);
            button.onclick = () => __awaiter(this, void 0, void 0, function* () {
                const scaleHints = yield printess.setImagePlacement(pc.name, p.id);
                if (scaleHints && p.imageMeta) {
                    p.imageMeta.scaleHints = scaleHints;
                    p.imageMeta.scale = scaleHints.scale;
                    p.imageMeta.placement = pc.name;
                    getImagePlacementControl(printess, p, forMobile, container);
                    const scaleControl = document.getElementById("range-label");
                    if (scaleControl) {
                        getImageScaleControl(printess, p, forMobile, scaleControl);
                    }
                }
            });
            container.appendChild(button);
        }
        return container;
    }
    function getImageScaleControl(printess, p, forMobile = false, element) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.canScale) || ((_b = p.validation) === null || _b === void 0 ? void 0 : _b.defaultValue) === p.value) {
            return null;
        }
        if (p.kind === "image-id" || !p.imageMeta) {
            return null;
        }
        if (element) {
            element.innerHTML = "";
        }
        const rangeLabel = element || document.createElement("label");
        rangeLabel.id = "range-label";
        const range = document.createElement("input");
        range.className = "form-range";
        if (forMobile)
            range.style.marginLeft = "0px";
        if (printess.isIPhone()) {
            range.classList.add("slider-catch-radius");
        }
        range.type = "range";
        range.min = (_d = (_c = p.imageMeta) === null || _c === void 0 ? void 0 : _c.scaleHints.min.toString()) !== null && _d !== void 0 ? _d : "0";
        range.max = (_f = (_e = p.imageMeta) === null || _e === void 0 ? void 0 : _e.scaleHints.max.toString()) !== null && _f !== void 0 ? _f : "0";
        range.step = "0.01";
        range.value = (_h = (_g = p.imageMeta) === null || _g === void 0 ? void 0 : _g.scale.toString()) !== null && _h !== void 0 ? _h : "0";
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
                }
                else if (lowQuality) {
                    span.textContent = printess.gl("ui.imageLowQuality");
                    span.style.color = "orange";
                    icon.style.color = "orange";
                }
                else {
                    icon = printess.getIcon("check-circle-solid");
                    icon.classList.add("scale-warning");
                    span.textContent = printess.gl("ui.imageGoodQuality");
                    span.style.color = "green";
                    icon.style.color = "green";
                }
                if (forMobile)
                    span.style.fontSize = "12px";
                rangeLabel.appendChild(icon);
                rangeLabel.appendChild(span);
            }
            else if (!forMobile) {
                rangeLabel.appendChild(span);
            }
        }
        rangeLabel.appendChild(range);
        if (forMobile) {
            rangeLabel.classList.add("form-control");
        }
        range.oninput = () => {
            const newScale = parseFloat(range.value);
            printess.setImageMetaProperty(p.id, "scale", newScale);
            if (p.imageMeta) {
                p.imageMeta.scale = newScale;
                span.textContent = forMobile ? "" : printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale));
                const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                }
            }
        };
        return rangeLabel;
    }
    function getInvertImageChecker(printess, p, metaProperty, forMobile = false) {
        var _a;
        if (forMobile) {
            return getInvertImageCheckerMobile(printess, p, metaProperty, forMobile);
        }
        const button = document.createElement("button");
        button.className = "btn btn-primary";
        if (forMobile) {
            button.classList.add("form-switch");
        }
        const svg = printess.getIcon(((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.invert) !== 0 ? "image-solid" : "image-regular");
        svg.style.width = "32px";
        svg.style.height = "32px";
        svg.style.cursor = "pointer";
        svg.style.margin = "5px";
        button.onclick = () => {
            var _a, _b;
            const newValue = ((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.invert) === 0 ? 100 : 0;
            printess.setNumberUiProperty(p, "image-invert", newValue);
            if (metaProperty && p.imageMeta) {
                p.imageMeta["invert"] = newValue;
            }
            const svg = printess.getIcon(((_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.invert) !== 0 ? "image-solid" : "image-regular");
            svg.style.width = "42px";
            svg.style.height = "42px";
            svg.style.cursor = "pointer";
            button.innerHTML = "";
            button.appendChild(svg);
        };
        button.appendChild(svg);
        return button;
    }
    function getInvertImageCheckerMobile(printess, p, metaProperty, forMobile = false) {
        var _a;
        const container = document.createElement("div");
        container.className = "form-check mt-3";
        if (forMobile) {
            container.classList.add("form-switch");
        }
        const id = "invert-image-checker";
        const input = document.createElement("input");
        input.className = "form-check-input";
        input.id = id;
        input.type = "checkbox";
        input.checked = ((_a = printess.getNumberUi(p, metaProperty)) === null || _a === void 0 ? void 0 : _a.value) === 0 ? false : true;
        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", id);
        if (forMobile)
            label.style.color = input.checked ? "var(--bs-light)" : "var(--bs-primary)";
        label.textContent = input.checked && forMobile ? printess.gl("ui.revertImage") : printess.gl("ui.invertImage");
        input.onchange = () => {
            const newValue = input.checked ? 100 : 0;
            printess.setNumberUiProperty(p, "image-invert", newValue);
            if (metaProperty && p.imageMeta) {
                p.imageMeta["invert"] = newValue;
            }
            if (forMobile)
                label.style.color = input.checked ? "var(--bs-light)" : "var(--bs-primary)";
            label.textContent = input.checked && forMobile ? printess.gl("ui.revertImage") : printess.gl("ui.invertImage");
        };
        container.appendChild(input);
        container.appendChild(label);
        return container;
    }
    function getNumberSlider(printess, p, metaProperty = null, forMobile = false) {
        const ui = printess.getNumberUi(p, metaProperty);
        if (!ui) {
            const er = document.createElement("div");
            er.textContent = printess.gl("ui.numberSlider", p.id, (metaProperty || ""));
            return er;
        }
        const rangeLabel = document.createElement("label");
        const range = document.createElement("input");
        range.className = "form-range";
        range.id = metaProperty !== null && metaProperty !== void 0 ? metaProperty : "";
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
                const imProp = metaProperty.replace("image-", "");
                p.imageMeta[imProp] = newValue;
            }
            else if (!metaProperty) {
                p.value = newValue;
            }
            const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
            }
        };
        const span = document.createElement("span");
        span.textContent = metaProperty ? printess.gl('ui.' + metaProperty) : printess.gl(p.label);
        rangeLabel.appendChild(span);
        rangeLabel.appendChild(range);
        if (forMobile) {
            rangeLabel.classList.add("form-control");
        }
        return rangeLabel;
    }
    function getFontSizeDropDown(printess, p, asList, dropdown, fullWidth = true) {
        var _a;
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.classList.add("btn-group");
            dropdown.classList.add("form-control");
        }
        dropdown.style.padding = "0";
        const sizes = printess.getFontSizesInPt().map(f => f + "pt");
        const ddContent = document.createElement("ul");
        if (p.textStyle && sizes.length) {
            const selectedItem = (_a = sizes.filter(itm => { var _a, _b; return (_b = itm === ((_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.size)) !== null && _b !== void 0 ? _b : "??pt"; })[0]) !== null && _a !== void 0 ? _a : null;
            const button = document.createElement("button");
            button.className = "btn btn-light dropdown-toggle";
            if (fullWidth) {
                button.classList.add("full-width");
            }
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
            button.setAttribute("aria-expanded", "false");
            if (selectedItem) {
                button.innerText = selectedItem;
            }
            else {
                button.innerText = p.textStyle ? Number(p.textStyle.size.slice(0, -2)).toFixed(2) + "pt" : "??pt";
            }
            dropdown.appendChild(button);
            if (asList) {
                ddContent.classList.add("list-group");
                ddContent.classList.add("list-group-grid-style");
            }
            else {
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
                li.classList.add("dropdown-item");
                li.onclick = () => {
                    button.innerHTML = "";
                    printess.setTextStyleProperty(p.id, "size", entry);
                    if (p.textStyle)
                        p.textStyle.size = entry;
                    button.innerText = entry;
                    if (asList) {
                        ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                        li.classList.add("active");
                        const mobileButtonDiv = document.getElementById(p.id + ":text-style-size");
                        if (mobileButtonDiv) {
                            drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                        }
                    }
                };
                li.innerText = entry;
                ddContent.appendChild(li);
            }
            dropdown.appendChild(ddContent);
        }
        if (asList) {
            return ddContent;
        }
        else {
            return dropdown;
        }
    }
    function getFontDropDown(printess, p, asList, dropdown, fullWidth = true) {
        var _a, _b;
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.classList.add("btn-group");
            dropdown.classList.add("form-control");
        }
        dropdown.style.padding = "0";
        const fonts = printess.getFonts(p.id);
        const ddContent = document.createElement("ul");
        let selectedItem = null;
        if (fonts.length) {
            if (p.textStyle) {
                selectedItem = (_a = fonts.filter(itm => { var _a, _b; return (_b = itm.name === ((_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.font)) !== null && _b !== void 0 ? _b : ""; })[0]) !== null && _a !== void 0 ? _a : null;
            }
            else {
                selectedItem = (_b = fonts.filter(itm => itm.name === p.value.toString())[0]) !== null && _b !== void 0 ? _b : null;
            }
            const button = document.createElement("button");
            button.className = "btn btn-light dropdown-toggle";
            if (fullWidth) {
                button.classList.add("full-width");
            }
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
            button.setAttribute("aria-expanded", "false");
            if (selectedItem) {
                button.appendChild(getDropdownImageContent(selectedItem.thumbUrl));
            }
            dropdown.appendChild(button);
            if (asList) {
                ddContent.classList.add("list-group");
            }
            else {
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
                    }
                    else {
                        printess.setProperty(p.id, entry.name);
                        p.value = entry.name;
                    }
                    if (asList) {
                        ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                        li.classList.add("active");
                        const mobileButtonDiv = document.getElementById(p.id + ":text-style-font");
                        if (mobileButtonDiv) {
                            drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
                        }
                    }
                    else {
                        button.innerHTML = "";
                        button.appendChild(getDropdownImageContent(entry.thumbUrl));
                    }
                };
                li.appendChild(getDropdownImageContent(entry.thumbUrl));
                ddContent.appendChild(li);
            }
            dropdown.appendChild(ddContent);
        }
        if (asList) {
            return ddContent;
        }
        else {
            return dropdown;
        }
    }
    function getDropdownImageContent(thumbUrl) {
        const img = document.createElement("img");
        img.src = thumbUrl;
        img.style.height = "20px";
        return img;
    }
    function getVAlignControl(printess, p, forMobile) {
        const group = document.createElement("div");
        group.className = "btn-group";
        group.classList.add("align-control-item");
        if (!forMobile) {
            group.style.marginLeft = "0px";
        }
        if (forMobile) {
            group.classList.add("form-control");
        }
        for (const v of ["top", "center", "bottom"]) {
            let icon = "text-top";
            switch (v) {
                case "center":
                    icon = "text-center";
                    break;
                case "bottom":
                    icon = "text-bottom";
                    break;
            }
            const id = p.id + "btnVAlignRadio" + v;
            group.appendChild(getRadioButton(printess, p, id, "vAlign", v));
            group.appendChild(getRadioLabel(printess, p, id, "vAlign", icon));
        }
        return group;
    }
    function getHAlignControl(printess, p, forMobile) {
        const group = document.createElement("div");
        group.className = "btn-group";
        group.classList.add("align-control-item");
        if (!forMobile) {
            group.style.marginLeft = "0px";
        }
        if (forMobile) {
            group.classList.add("form-control");
        }
        for (const v of ["left", "center", "right", "justifyLeft"]) {
            let icon = "text-align-left";
            switch (v) {
                case "right":
                    icon = "text-align-right";
                    break;
                case "center":
                    icon = "text-align-center";
                    break;
                case "justifyLeft":
                    icon = "text-align-justify-left";
                    break;
                case "justifyCenter":
                    icon = "text-align-justify-center";
                    break;
                case "justifyRight":
                    icon = "text-align-justify-right";
                    break;
                case "justifyJustify":
                    icon = "text-align-justify-justify";
                    break;
            }
            const id = p.id + "btnHAlignRadio" + v;
            group.appendChild(getRadioButton(printess, p, id, "hAlign", v));
            group.appendChild(getRadioLabel(printess, p, id, "hAlign", icon));
        }
        return group;
    }
    function getVAlignAndHAlignControl(printess, p, forMobile) {
        const container = document.createElement("div");
        container.className = "align-control-container";
        container.appendChild(getHAlignControl(printess, p, forMobile));
        container.appendChild(getVAlignControl(printess, p, forMobile));
        return container;
    }
    function getRadioLabel(printess, p, id, name, icon) {
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
    function getRadioButton(printess, p, id, name, value) {
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
            if (p.textStyle)
                p.textStyle[name] = value;
            let mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-" + name);
            if (!mobileButtonDiv && name === "hAlign") {
                mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-vAlign-hAlign");
            }
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p], p.controlGroup);
            }
        };
        return radio;
    }
    function getPaginationItem(printess, content, spread, page, isActive, bigSpaceBetween = false, disabled = false) {
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
        }
        else if (content === "previous") {
            const svg = printess.getIcon("carret-left-solid");
            svg.style.height = "1.3em";
            a.appendChild(svg);
        }
        else if (content === "next") {
            const svg = printess.getIcon("carret-right-solid");
            svg.style.height = "1.3em";
            a.appendChild(svg);
        }
        else if (content === "ellipsis") {
            a.innerHTML = "&#8230";
            a.className = "page-ellipsis disabled";
            li.style.opacity = "0.4";
        }
        li.appendChild(a);
        if (content === "ellipsis" || content === "previous" ||
            (spread &&
                ((page === "left-page" && spread.pages === 1) || (page === "right-page" && spread.pages === 2)))) {
            if (bigSpaceBetween) {
                li.classList.add("me-3");
            }
            else {
                li.classList.add("me-2");
            }
        }
        li.onclick = () => {
            uih_currentVisiblePage = null;
            if (content === "previous") {
                printess.previousPage();
            }
            else if (content === "next") {
                printess.nextPage();
            }
            else if (spread) {
                printess.selectSpread(spread.index, page);
                document.querySelectorAll(".page-item").forEach(pi => pi.classList.remove("active"));
                li.classList.add("active");
            }
        };
        return li;
    }
    function updatePageThumbnail(spreadId, pageId, url) {
        const thumb = document.getElementById("thumb_" + spreadId + "_" + pageId);
        if (thumb) {
            thumb.style.backgroundImage = 'url("' + url + '")';
        }
    }
    function refreshUndoRedoState(printess) {
        const btnUndo = document.querySelector(".undo-button");
        if (btnUndo) {
            if (printess.undoCount() === 0) {
                btnUndo.disabled = true;
            }
            else {
                btnUndo.disabled = false;
            }
        }
        const btnRedo = document.querySelector(".redo-button");
        if (btnRedo) {
            if (printess.redoCount() === 0) {
                btnRedo.disabled = true;
            }
            else {
                btnRedo.disabled = false;
            }
        }
    }
    function getCloseEditorDialog(printess) {
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
        };
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.textContent = printess.gl("ui.buttonYes");
        ok.onclick = () => __awaiter(this, void 0, void 0, function* () {
            hideModal(id);
            const callback = printess.getBackButtonCallback();
            if (callback) {
                handleBackButtonCallback(printess, callback);
            }
            else {
                alert(printess.gl("ui.backButtonCallback"));
            }
        });
        footer.appendChild(close);
        footer.appendChild(ok);
        showModal(printess, id, content, printess.gl("ui.closeEditorTitle", printess.getTemplateTitle()), footer);
    }
    function getBackUndoMiniBar(printess) {
        const miniBar = document.createElement("div");
        const btnBack = document.createElement("button");
        const cornerTools = printess.pageNavigationDisplay() === "icons";
        const caption = printess.gl("ui.buttonBack");
        btnBack.className = "btn btn-outline-secondary";
        if (cornerTools) {
            btnBack.classList.add("btn-sm");
        }
        else {
            btnBack.classList.add("me-2");
            btnBack.innerText = caption;
            btnBack.style.marginRight = "5px";
        }
        const icon = cornerTools ? "close" : printess.gl("ui.buttonBackIcon");
        if (icon) {
            const svg = printess.getIcon(icon);
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
                }
                else {
                    alert(printess.gl("ui.backButtonCallback"));
                }
            }
            else {
                getCloseEditorDialog(printess);
            }
        };
        if (printess.hasPreviewBackButton() && !cornerTools) {
            const previewBackButton = getPreviewBackButton(printess);
            previewBackButton.classList.add("me-2");
            miniBar.appendChild(previewBackButton);
        }
        else if (!cornerTools) {
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
            };
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
            };
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
            if (!cornerTools)
                miniBar.appendChild(btnZoomIn);
            const dropdownItems = getItemsForZoomDropdown(printess);
            miniBar.appendChild(getDropdownMenu(printess, "", dropdownItems, false, "search-light"));
            const btnZoomOut = document.createElement("button");
            btnZoomOut.className = "btn btn-sm btn-outline-secondary me-2";
            const iconZoomOut = printess.getIcon("minus-light");
            iconZoomOut.classList.add("icon");
            btnZoomOut.appendChild(iconZoomOut);
            btnZoomOut.onclick = () => printess.zoomOut();
            if (!cornerTools)
                miniBar.appendChild(btnZoomOut);
        }
        if (printess.hasExpertButton()) {
            miniBar.appendChild(getExpertModeButton(printess, false));
        }
        miniBar.classList.add("undo-redo-bar");
        if (cornerTools) {
            miniBar.appendChild(document.createElement("div"));
            miniBar.appendChild(btnBack);
        }
        return miniBar;
    }
    function getDropdownMenu(printess, title, dropdownItems, showDropdownTriangle = true, icon) {
        const cornerTools = printess.pageNavigationDisplay() === "icons";
        const dropdown = document.createElement("div");
        dropdown.className = "dropdown me-1";
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
                if (di.disabled)
                    btn.classList.add("disabled");
                btn.textContent = printess.gl(di.caption);
                btn.onclick = () => di.task();
                li.appendChild(btn);
                ul.appendChild(li);
            }
        });
        dropdown.appendChild(ul);
        return dropdown;
    }
    function getItemsForZoomDropdown(printess) {
        const spreadId = printess.pageInfoSync().spreadId;
        const currentSpreadIndex = printess.getAllSpreads().findIndex(s => s.spreadId === spreadId);
        const zoomItems = [{
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
                    uih_currentVisiblePage = "left-page";
                }
            }, {
                caption: "ui.zoomRightPage",
                show: printess.isDoublePageSpread() && uih_currentVisiblePage !== "right-page",
                task: () => {
                    printess.selectSpread(currentSpreadIndex, "right-page");
                    uih_currentVisiblePage = "right-page";
                }
            }, {
                caption: "ui.zoomFullPage",
                show: printess.isDoublePageSpread() && uih_currentVisiblePage !== "entire" || !printess.isDoublePageSpread(),
                task: () => {
                    printess.selectSpread(currentSpreadIndex, "entire");
                    uih_currentVisiblePage = "entire";
                }
            }
        ];
        return zoomItems;
    }
    function getPageArrangementButtons(printess, addSpreads, removeSpreads, forMobile) {
        const li = document.createElement("li");
        li.className = "big-page-item mr";
        if (forMobile) {
            li.classList.add("mobile");
        }
        else {
            li.appendChild(document.createElement("div"));
        }
        const pageButtons = document.createElement("div");
        pageButtons.className = "modify-page-buttons";
        if (addSpreads > 0) {
            const btnAdd = document.createElement("div");
            btnAdd.className = "btn btn-sm btn-outline-secondary w-100";
            btnAdd.innerText = "+" + (addSpreads * 2) + " " + printess.gl("ui.pages");
            btnAdd.onclick = () => printess.addSpreads();
            pageButtons.appendChild(btnAdd);
        }
        if (addSpreads || removeSpreads) {
            const arrangePagesBtn = document.createElement("button");
            arrangePagesBtn.className = "btn btn-sm btn-outline-secondary w-100";
            arrangePagesBtn.innerText = "Arrange Pages";
            arrangePagesBtn.onclick = () => getArrangePagesOverlay(printess, forMobile);
            pageButtons.appendChild(arrangePagesBtn);
        }
        li.appendChild(pageButtons);
        return li;
    }
    function renderPageNavigation(printess, container, large = false, forMobile = false) {
        var _a, _b, _c, _d;
        const spreads = printess.getAllSpreads();
        const info = printess.pageInfoSync();
        let lastScrollLeftPos = 0;
        const pages = container || document.querySelector("#desktop-pagebar");
        if (pages) {
            const scrollContainer = pages.querySelector(".pagination");
            if (scrollContainer && printess.pageNavigationDisplay() === "icons") {
                lastScrollLeftPos = scrollContainer.scrollLeft;
            }
            pages.innerHTML = "";
            if (!forMobile && printess.pageNavigationDisplay() !== "icons") {
                pages.appendChild(getBackUndoMiniBar(printess));
            }
            const ul = document.createElement("ul");
            ul.className = "pagination";
            if (large) {
                ul.classList.add("pagination-lg");
            }
            pages.classList.remove("tabs");
            pages.classList.remove("big");
            if (printess.pageNavigationDisplay() === "icons") {
                pages.classList.add("big");
                ul.style.overflowX = "auto";
                document.documentElement.style.setProperty("--editor-pagebar-height", "122px");
                document.documentElement.style.setProperty("--editor-margin-top", "10px");
            }
            else if (printess.stepHeaderDisplay() === "tabs list") {
                pages.classList.add("tabs");
                ul.style.overflowX = "auto";
                document.documentElement.style.setProperty("--editor-pagebar-height", "50px");
            }
            else {
                ul.classList.add("justify-content-center");
                document.documentElement.style.setProperty("--editor-pagebar-height", "50px");
            }
            if (printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "badge list") {
                const tabsContainer = document.createElement("div");
                tabsContainer.className = "step-tabs-list";
                tabsContainer.id = "step-tab-list";
                tabsContainer.style.margin = "0 10px";
                if (!forMobile && printess.stepHeaderDisplay() === "badge list") {
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
                        const tabListScrollbar = document.getElementById("tabs-list-scrollbar");
                        if (tabListScrollbar && tabListScrollbar.scrollWidth > tabListScrollbar.clientWidth) {
                            scrollToLeft(tabListScrollbar, tabListScrollbar.scrollLeft - 200, 300, tabListScrollbar.scrollLeft);
                        }
                        else if (tabListScrollbar.scrollWidth === tabListScrollbar.clientWidth && printess.hasPreviousStep()) {
                            printess.previousStep();
                        }
                        else {
                            prevTabLink.classList.add("disabled");
                        }
                    };
                }
                tabsContainer.appendChild(getStepsTabsList(printess, forMobile, printess.stepHeaderDisplay()));
                if (!forMobile && printess.stepHeaderDisplay() !== "tabs list") {
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
                        const tabListScrollbar = document.getElementById("tabs-list-scrollbar");
                        if (tabListScrollbar && tabListScrollbar.scrollWidth > tabListScrollbar.clientWidth) {
                            scrollToLeft(tabListScrollbar, tabListScrollbar.scrollLeft + 200, 300, tabListScrollbar.scrollLeft);
                        }
                        else if (tabListScrollbar.scrollWidth === tabListScrollbar.clientWidth && printess.hasNextStep()) {
                            printess.nextStep();
                        }
                        else {
                            nextTabLink.classList.add("disabled");
                        }
                    };
                }
                pages.appendChild(tabsContainer);
                const wrapper = document.createElement("div");
                wrapper.className = "d-flex price-basket-wrapper";
                const priceDiv = document.createElement("div");
                priceDiv.className = "total-price-container";
                priceDiv.id = "total-price-display";
                if (uih_currentPriceDisplay) {
                    getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
                }
                const button = document.createElement("button");
                button.className = "btn btn-primary ms-2";
                const icon = printess.getIcon("shopping-cart-add");
                icon.style.width = "25px";
                icon.style.height = "25px";
                button.onclick = () => addToBasket(printess);
                button.appendChild(icon);
                wrapper.appendChild(priceDiv);
                wrapper.appendChild(button);
                if (printess.stepHeaderDisplay() === "tabs list")
                    pages.appendChild(wrapper);
                return;
            }
            if (printess.pageNavigationDisplay() === "icons") {
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
                            if (isActive && !uih_currentVisiblePage)
                                uih_currentVisiblePage = page;
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
                                    }
                                    else {
                                        li.classList.add("mr");
                                    }
                                }
                                li.classList.add("ml");
                            }
                            if (isActive)
                                li.classList.add("active");
                            const p = spread.thumbnails ? (_a = spread.thumbnails[page === "right-page" ? 1 : 0]) !== null && _a !== void 0 ? _a : null : null;
                            const url = (_b = p === null || p === void 0 ? void 0 : p.url) !== null && _b !== void 0 ? _b : "";
                            const thumb = document.createElement("div");
                            thumb.className = "big-page-thumb";
                            thumb.id = "thumb_" + spread.spreadId + "_" + ((_c = p === null || p === void 0 ? void 0 : p.pageId) !== null && _c !== void 0 ? _c : "");
                            if (url) {
                                thumb.style.backgroundImage = "url(" + url + ")";
                                thumb.style.backgroundColor = (_d = p === null || p === void 0 ? void 0 : p.bgColor) !== null && _d !== void 0 ? _d : "white";
                            }
                            if (spread.pages > 1) {
                                const shadow = document.createElement("div");
                                if (pageIndex === 0) {
                                    shadow.classList.add("book-shadow-gradient-left");
                                    thumb.style.borderRight = "none";
                                }
                                else {
                                    shadow.classList.add("book-shadow-gradient-right");
                                    thumb.style.borderLeft = "none";
                                }
                                thumb.appendChild(shadow);
                            }
                            thumb.style.width = (spread.width / spread.pages / spread.height * 72) + "px";
                            thumb.style.backgroundSize = "cover";
                            const caption = document.createElement("div");
                            caption.className = "big-page-caption";
                            caption.innerText = spread.names[pageIndex] ? spread.names[pageIndex] : pageNo.toString();
                            if (forMobile) {
                                li.appendChild(thumb);
                                li.appendChild(caption);
                            }
                            else {
                                li.appendChild(caption);
                                li.appendChild(thumb);
                            }
                            li.onclick = () => {
                                uih_currentVisiblePage = null;
                                printess.selectDocumentAndSpread(doc.docId, spread.index, page);
                                document.querySelectorAll(".big-page-item").forEach(pi => pi.classList.remove("active"));
                                li.classList.add("active");
                            };
                            pagesContainer.appendChild(li);
                        }
                    }
                }
                const addSpreads = printess.canAddSpreads();
                const removeSpreads = printess.canRemoveSpreads();
                if (addSpreads > 0 || removeSpreads > 0) {
                    pagesContainer.appendChild(getPageArrangementButtons(printess, addSpreads, removeSpreads, forMobile));
                }
                ul.appendChild(pagesContainer);
            }
            else if (spreads.length > 1 && printess.pageNavigationDisplay() === "numbers") {
                const prev = getPaginationItem(printess, "previous");
                if (info.isFirst) {
                    prev.classList.add("disabled");
                }
                ul.appendChild(prev);
                const count = spreads.reduce((prev, cur) => prev + cur.pages, 0);
                const current = info.current;
                let pageNo = 0;
                let lastPos = "start";
                for (const spread of spreads) {
                    for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
                        pageNo++;
                        const page = pageIndex === 0 ? "left-page" : "right-page";
                        const isActive = current === pageNo;
                        if (isActive && !uih_currentVisiblePage)
                            uih_currentVisiblePage = page;
                        let pos = "skip";
                        if (pageNo === 1)
                            pos = "start";
                        if (pageNo === count)
                            pos = "end";
                        if (current === 1) {
                            if (pageNo === current + 1 || pageNo === current + 2) {
                                pos = "current";
                            }
                        }
                        else if (current === count) {
                            if (pageNo === current - 1 || pageNo === current - 2) {
                                pos = "current";
                            }
                        }
                        else if (current % 2 === 0) {
                            if (pageNo === current || pageNo === current + 1) {
                                pos = "current";
                            }
                        }
                        else {
                            if (pageNo === current - 1 || pageNo === current) {
                                pos = "current";
                            }
                        }
                        if (pos === "skip") {
                            if (lastPos !== "skip") {
                                ul.appendChild(getPaginationItem(printess, "ellipsis"));
                            }
                        }
                        else {
                            let disable = false;
                            if (printess.lockCoverInside()) {
                                if (pageNo === 2 || pageNo === count - 2) {
                                    disable = true;
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
                const active = ul.querySelector(".active");
                if (active) {
                    const d = 170;
                    if (active.offsetLeft - ul.scrollLeft > ul.offsetWidth - d) {
                        ul.scrollTo(active.offsetLeft - ul.offsetWidth + d, 0);
                    }
                    else if (active.offsetLeft - ul.scrollLeft < d) {
                        ul.scrollTo(active.offsetLeft - d, 0);
                    }
                }
            }
            if (printess.pageNavigationDisplay() === "icons" && !forMobile) {
                const cornerTools = document.createElement("div");
                cornerTools.className = "corner-tools";
                if (printess.hasExpertButton()) {
                    cornerTools.classList.add("expert-mode");
                }
                cornerTools.appendChild(getBackUndoMiniBar(printess));
                const priceDiv = document.createElement("div");
                priceDiv.className = "total-price-container";
                priceDiv.id = "total-price-display";
                if (uih_currentPriceDisplay) {
                    getPriceDisplay(printess, priceDiv, uih_currentPriceDisplay);
                }
                else {
                    const h2 = document.createElement("h2");
                    h2.innerText = printess.gl(printess.getTemplateTitle());
                    priceDiv.appendChild(h2);
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
    function getPageItem(printess, pageNo, pageIndex, spread, prevSpreadId, forMobile) {
        var _a, _b, _c, _d;
        const page = pageIndex === 0 ? "left-page" : "right-page";
        const pageItem = document.createElement("div");
        pageItem.className = "big-page-item" + (forMobile ? " mobile" : "");
        const p = spread && spread.thumbnails ? (_a = spread.thumbnails[page === "right-page" ? 1 : 0]) !== null && _a !== void 0 ? _a : null : null;
        const url = (_b = p === null || p === void 0 ? void 0 : p.url) !== null && _b !== void 0 ? _b : "";
        const thumb = document.createElement("div");
        thumb.className = "big-page-thumb";
        thumb.id = spread ? "thumb_" + spread.spreadId + "_" + ((_c = p === null || p === void 0 ? void 0 : p.pageId) !== null && _c !== void 0 ? _c : "") : "";
        if (url) {
            thumb.style.backgroundImage = "url(" + url + ")";
            thumb.style.backgroundColor = (_d = p === null || p === void 0 ? void 0 : p.bgColor) !== null && _d !== void 0 ? _d : "white";
        }
        const spreadForWidth = spread || printess.getAllSpreads()[1];
        if (forMobile) {
            thumb.style.height = ((spreadForWidth.height / spreadForWidth.width * (window.innerWidth - 40) * 0.5) * spreadForWidth.pages) + "px";
            thumb.style.width = ((window.innerWidth - 40) * 0.5) + "px";
        }
        else {
            thumb.style.width = (spreadForWidth.width / spreadForWidth.pages / spreadForWidth.height * 150) + "px";
        }
        const caption = document.createElement("div");
        caption.className = "big-page-caption";
        caption.innerText = spread && spread.names[pageIndex] ? spread.names[pageIndex] : pageNo.toString();
        pageItem.appendChild(caption);
        pageItem.appendChild(thumb);
        pageItem.ondragenter = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            let marker;
            if (page === "right-page") {
                marker = document.querySelector(`[data-after=${spread.spreadId}]`);
            }
            else {
                marker = document.querySelector(`[data-before=${spread.spreadId}]`);
            }
            uih_lastDragTarget = page === "right-page" ? spread.spreadId : prevSpreadId;
            if (marker)
                marker.style.background = "var(--bs-primary)";
        };
        pageItem.ondragover = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            let marker;
            if (page === "right-page") {
                marker = document.querySelector(`[data-after=${spread.spreadId}]`);
            }
            else {
                marker = document.querySelector(`[data-before=${spread.spreadId}]`);
            }
            uih_lastDragTarget = page === "right-page" ? spread.spreadId : prevSpreadId;
            if (marker)
                marker.style.background = "var(--bs-primary)";
        };
        pageItem.ondragleave = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            let marker;
            if (page === "right-page") {
                marker = document.querySelector(`[data-after=${spread.spreadId}]`);
            }
            else {
                marker = document.querySelector(`[data-before=${spread.spreadId}]`);
            }
            uih_lastDragTarget = undefined;
            if (marker)
                marker.style.background = "transparent";
        };
        pageItem.ondrop = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
        };
        return pageItem;
    }
    function getSpreadSeparator(spreadId, nextSpreadId) {
        const separator = document.createElement("li");
        separator.className = "spread-separator";
        separator.id = spreadId + "_separator";
        const marker = document.createElement("div");
        marker.className = "spread-drop-marker";
        marker.setAttribute("data-before", nextSpreadId);
        marker.setAttribute("data-after", spreadId);
        separator.ondragenter = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            uih_lastDragTarget = spreadId;
            marker.style.background = "var(--bs-primary)";
        };
        separator.ondragover = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            uih_lastDragTarget = spreadId;
            marker.style.background = "var(--bs-primary)";
        };
        separator.ondragleave = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            uih_lastDragTarget = undefined;
            marker.style.background = "transparent";
        };
        separator.ondrop = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
        };
        separator.appendChild(document.createElement("div"));
        separator.appendChild(marker);
        return separator;
    }
    function getSpreadItem(printess, pageNo, forMobile, spread, spreads) {
        const canAddRemoveSpread = spread.index !== 0 && spread.index !== spreads.length - 1;
        const addSpreads = printess.isNoOfPagesValid(spreads.length) ? printess.canAddSpreads(spreads.length) : 1;
        const removeSpreads = printess.canRemoveSpreads(spreads.length);
        const spreadItem = document.createElement("li");
        spreadItem.className = "spread-item";
        spreadItem.id = spread.spreadId;
        spreadItem.draggable = canAddRemoveSpread;
        spreadItem.ondragstart = (ev) => {
            var _a;
            (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', spread.spreadId);
        };
        spreadItem.ondragend = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            const marker = document.querySelectorAll(".spread-drop-marker");
            marker.forEach(m => m.style.background = "transparent");
            const modalBody = document.querySelector("div.modal-body");
            if (modalBody && spreads && spread && uih_lastDragTarget && uih_lastDragTarget !== spread.spreadId) {
                const lastScrollPosition = modalBody.scrollTop;
                const filteredSpreads = spreads.filter(s => s.spreadId !== spread.spreadId);
                const idx = filteredSpreads.findIndex(s => s.spreadId === uih_lastDragTarget);
                filteredSpreads.splice(idx + 1, 0, spread);
                filteredSpreads.forEach((s, i) => s.index = i);
                modalBody.innerHTML = "";
                modalBody.appendChild(getArrangePagesContent(printess, forMobile, undefined, filteredSpreads, [spread.spreadId]));
                modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
                uih_lastDragTarget = undefined;
            }
        };
        spreadItem.ondrop = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
        };
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
            plusBtn.onclick = () => {
                const modalBody = document.querySelector("div.modal-body");
                const newSpreadIds = [];
                for (let i = 0; i < addSpreads; i++) {
                    const newSpread = {
                        docId: spread.docId,
                        spreadId: "newSpread_" + Math.floor(Math.random() * (999999 - 100000) + 100000),
                        index: spread.index + 1,
                        name: "",
                        names: spread.pages === 1 ? [""] : ["", ""],
                        width: spread.width,
                        height: spread.height,
                        pages: spread.pages,
                        thumbnails: [{ url: "", bgColor: "white", pageId: "" }]
                    };
                    const idx = spread.index + 1;
                    spreads.sort((a, b) => a.index - b.index);
                    for (let i = spread.index + 1; i < spreads.length; i++) {
                        spreads[i].index = i + 1;
                    }
                    spreads.splice(idx, 0, newSpread);
                    newSpreadIds.push(newSpread.spreadId);
                }
                if (modalBody) {
                    const lastScrollPosition = modalBody.scrollTop;
                    modalBody.innerHTML = "";
                    modalBody.appendChild(getArrangePagesContent(printess, forMobile, undefined, spreads, newSpreadIds));
                    modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
                }
            };
            spreadItem.appendChild(plusBtn);
        }
        if (removeSpreads && canAddRemoveSpread) {
            const deleteBtn = document.createElement("div");
            deleteBtn.className = "remove-pages-icon";
            const deleteIcon = printess.getIcon("trash");
            deleteIcon.classList.add("delete-btn");
            deleteBtn.onclick = () => {
                spreadItem.classList.add("delete-spread-box", "spread-box", "faded-in");
                requestAnimationFrame(() => {
                    spreadItem.classList.remove("faded-in");
                    spreadItem.classList.add("faded-out");
                });
                window.setTimeout(() => {
                    const separator = document.getElementById(spread.spreadId + "_separator");
                    if (separator)
                        separator.remove();
                    spreadItem.remove();
                    const filteredSpreads = spreads.filter(s => s.spreadId !== spread.spreadId);
                    filteredSpreads.forEach((s, i) => s.index = i);
                    const modalBody = document.querySelector("div.modal-body");
                    if (modalBody) {
                        const lastScrollPosition = modalBody.scrollTop;
                        modalBody.innerHTML = "";
                        modalBody.appendChild(getArrangePagesContent(printess, forMobile, undefined, filteredSpreads));
                        modalBody.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
                    }
                }, 500);
            };
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
            spreadItem.appendChild(moveBtn);
        }
        return spreadItem;
    }
    function getArrangePagesContent(printess, forMobile, doc, spreads, newSpreadIds, modalFooter, warning) {
        const content = document.createElement("div");
        if (!forMobile) {
            const infoText = document.createElement("p");
            infoText.className = "arrange-pages-info-text";
            infoText.textContent = printess.gl("ui.arrangePagesInfoText");
            content.appendChild(infoText);
        }
        const scrollTopDiv = document.createElement("div");
        scrollTopDiv.className = "scroll-up-indicator no-selection";
        scrollTopDiv.ondragover = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            const container = document.querySelector(".modal-body");
            if (container) {
                if (forMobile) {
                    container.scrollTop -= 10;
                }
                else {
                    container.scrollTo({ top: container.scrollTop - 10, behavior: 'smooth' });
                }
            }
        };
        content.appendChild(scrollTopDiv);
        const ul = document.createElement("div");
        ul.className = "pagination pagination-lg";
        const pagesContainer = document.createElement("ul");
        pagesContainer.className = "pages-container";
        pagesContainer.id = "page-arrange-dialog-spreads";
        const docs = printess.getAllDocsAndSpreads();
        doc = doc || docs.filter(doc => doc.isBook)[0];
        spreads = spreads || doc.spreads;
        modalFooter = modalFooter || document.querySelector(".modal-footer");
        warning = warning || document.getElementById("spread-size-warning");
        if (warning && modalFooter) {
            if (!printess.isNoOfPagesValid(spreads.length)) {
                modalFooter.style.gridTemplateColumns = "1fr auto auto";
                warning.style.display = "block";
            }
            else {
                modalFooter.style.gridTemplateColumns = "auto auto";
                warning.style.display = "none";
            }
        }
        let pageNo = 0;
        for (const spread of spreads) {
            const spreadItem = getSpreadItem(printess, pageNo, forMobile, spread, spreads);
            pagesContainer.appendChild(spreadItem);
            if (newSpreadIds && newSpreadIds.includes(spread.spreadId)) {
                spreadItem.classList.add("spread-box", "faded-out");
                requestAnimationFrame(() => {
                    spreadItem.classList.remove("faded-out");
                });
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
        scrollBottomDiv.ondragover = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            const container = document.querySelector(".modal-body");
            if (container) {
                if (forMobile) {
                    container.scrollTop += 10;
                }
                else {
                    container.scrollTo({ top: container.scrollTop + 10, behavior: 'smooth' });
                }
            }
        };
        content.appendChild(scrollBottomDiv);
        return content;
    }
    function getArrangePagesOverlay(printess, forMobile) {
        const docs = printess.getAllDocsAndSpreads();
        const doc = docs.filter(doc => doc.isBook)[0];
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
        };
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.id = "apply-book-changes";
        ok.textContent = printess.gl("ui.applyChanges");
        ok.onclick = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const allSpreadIds = [];
            let showPagesAddedInfo = false;
            for (const div of (_b = (_a = document.querySelector("#page-arrange-dialog-spreads")) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : []) {
                if (div.classList.contains("spread-item")) {
                    const id = div.id;
                    if (id) {
                        if (id.startsWith("newSpread_")) {
                            allSpreadIds.push("newSpread");
                        }
                        else {
                            allSpreadIds.push(id);
                        }
                    }
                }
            }
            if (!printess.isNoOfPagesValid(allSpreadIds.length)) {
                showPagesAddedInfo = true;
                const idx = allSpreadIds.length - 1;
                allSpreadIds.splice(idx, 0, "newSpread");
            }
            printess.reArrangeSpreads(allSpreadIds);
            hideModal("pageArrangementDialog");
            if (showPagesAddedInfo)
                getPagesAddedInfoOverlay(printess, doc.facingPages);
            printess.resizePrintess();
        });
        footer.appendChild(warning);
        footer.appendChild(close);
        footer.appendChild(ok);
        const content = getArrangePagesContent(printess, forMobile, doc, undefined, undefined, footer, warning);
        showModal(printess, "pageArrangementDialog", content, title, footer);
    }
    function getPagesAddedInfoOverlay(printess, facingPages) {
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
        };
        footer.appendChild(close);
        showModal(printess, "pageAddedInfoDialog", content, title, footer);
    }
    function renderMyImagesTab(printess, forMobile, p, images, imagesContainer, showSearchIcon = true, showMobileImagesUploadBtn = false) {
        var _a, _b;
        const container = imagesContainer || document.createElement("div");
        container.id = "image-tab-container";
        container.innerHTML = "";
        const imageList = document.createElement("div");
        imageList.classList.add("image-list");
        images = images || printess.getImages(p === null || p === void 0 ? void 0 : p.id);
        const dragDropHint = document.createElement("p");
        dragDropHint.style.fontFamily = "var(--bs-font-sans-serif)";
        dragDropHint.style.marginTop = "10px";
        dragDropHint.textContent = printess.gl("ui.dragDropHint");
        const multipleImagesHint = document.createElement("p");
        multipleImagesHint.id = "multiple-images-hint";
        multipleImagesHint.style.fontFamily = "var(--bs-font-sans-serif)";
        multipleImagesHint.textContent = printess.gl("ui.uploadMultipleImagesInfo");
        if (!p || ((_a = p === null || p === void 0 ? void 0 : p.imageMeta) === null || _a === void 0 ? void 0 : _a.canUpload)) {
            const distributeBtn = document.createElement("button");
            distributeBtn.id = "distribute-button";
            distributeBtn.className = "btn btn-secondary mb-3";
            distributeBtn.innerText = printess.gl("ui.buttonDistribute");
            distributeBtn.onclick = () => {
                getDistributionOverlay(printess, forMobile, p, container);
            };
            const twoButtons = document.createElement("div");
            twoButtons.id = "two-buttons";
            twoButtons.style.display = "grid";
            twoButtons.appendChild(getImageUploadButton(printess, (_b = p === null || p === void 0 ? void 0 : p.id) !== null && _b !== void 0 ? _b : "", false, p !== undefined));
            if (printess.showImageDistributionButton()) {
                twoButtons.style.gridTemplateColumns = "1fr 15px 1fr";
                twoButtons.appendChild(document.createElement("div"));
                twoButtons.appendChild(distributeBtn);
            }
            if (!forMobile || showMobileImagesUploadBtn)
                container.appendChild(twoButtons);
        }
        if (printess.showSearchBar()) {
            container.appendChild(getSearchBar(printess, p, container, forMobile, showSearchIcon));
        }
        const imageGroups = printess.getImageGroups(p === null || p === void 0 ? void 0 : p.id);
        if ((!p || p.kind !== "selection-text-style")) {
            if (imageGroups.length > 1) {
                if ((images === null || images === void 0 ? void 0 : images.filter(i => i.group === uih_activeImageAccordion).length) === 0) {
                    uih_activeImageAccordion = imageGroups[1];
                }
                const accordion = document.createElement("div");
                accordion.className = "accordion mb-3";
                accordion.id = "accordion_" + (p === null || p === void 0 ? void 0 : p.id);
                imageGroups.forEach(group => {
                    if (images === null || images === void 0 ? void 0 : images.filter(i => i.group === group).length) {
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
                        button.setAttribute("aria-controls", "collapse-" + group.replace(" ", ""));
                        button.textContent = group === "Buyer Upload" ? printess.gl("ui.imagesTab") : printess.gl(group);
                        button.onclick = () => uih_activeImageAccordion = group;
                        const collapse = document.createElement("div");
                        collapse.className = `accordion-collapse collapse ${group === uih_activeImageAccordion ? "show" : ""}`;
                        collapse.setAttribute("aria-labelledby", "heading-" + group.replace(" ", ""));
                        collapse.setAttribute("data-bs-parent", "#accordion_" + (p === null || p === void 0 ? void 0 : p.id));
                        collapse.id = "collapse-" + group.replace(" ", "");
                        const body = document.createElement("div");
                        body.className = "accordion-body";
                        const groupList = document.createElement("div");
                        groupList.classList.add("image-list");
                        for (const im of images === null || images === void 0 ? void 0 : images.filter(i => i.group === group)) {
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
            }
            else {
                for (const im of images) {
                    imageList.appendChild(getImageThumb(printess, p, im, container, imageList, forMobile));
                }
                container.appendChild(imageList);
            }
        }
        if (!forMobile && images.length > 0 && (p === null || p === void 0 ? void 0 : p.kind) !== "image-id")
            container.appendChild(dragDropHint);
        if (images.length === 0 && !(p === null || p === void 0 ? void 0 : p.id.startsWith("FF_")))
            container.appendChild(multipleImagesHint);
        return container;
    }
    function getImageThumb(printess, p, im, container, imageList, forMobile) {
        var _a;
        const thumb = document.createElement("div");
        thumb.className = "big";
        thumb.draggable = true;
        thumb.ondragstart = (ev) => {
            var _a;
            if ((p === null || p === void 0 ? void 0 : p.kind) === "image-id") {
                ev.preventDefault();
            }
            (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', `${im.id}`);
        };
        thumb.style.backgroundImage = im.thumbCssUrl;
        thumb.style.position = "relative";
        thumb.style.width = "91px";
        thumb.style.height = "91px";
        if (im.inUse) {
            const chk = printess.getIcon("check-square");
            chk.classList.add("image-inuse-checker");
            thumb.appendChild(chk);
        }
        else {
            const cls = document.createElement("div");
            cls.classList.add("delete-btn-container");
            const icon = printess.getIcon("trash");
            icon.classList.add("delete-btn");
            icon.onclick = (e) => {
                e.stopImmediatePropagation();
                imageList.removeChild(thumb);
                printess.deleteImages([im]);
            };
            cls.appendChild(icon);
            if (forMobile)
                cls.style.display = "block";
            if (!p || ((_a = p === null || p === void 0 ? void 0 : p.imageMeta) === null || _a === void 0 ? void 0 : _a.canUpload))
                thumb.appendChild(cls);
        }
        if (p) {
            if (im.id === p.value) {
                thumb.style.border = "2px solid var(--bs-primary)";
                thumb.style.outline = "3px solid var(--bs-primary)";
            }
            thumb.onclick = () => __awaiter(this, void 0, void 0, function* () {
                const scaleHints = yield printess.setProperty(p.id, im.id);
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
                        getMobileButtons(printess, mobileButtonsContainer, p.id, true, true);
                    }
                    const newImages = printess.getImages(p === null || p === void 0 ? void 0 : p.id);
                    renderMyImagesTab(printess, forMobile, p, newImages, container);
                    closeMobileFullscreenContainer();
                }
                else {
                    const propsDiv = document.getElementById("tabs-panel-" + p.id);
                    if (propsDiv) {
                        propsDiv.replaceWith(getPropertyControl(printess, p));
                    }
                }
            });
        }
        else {
            thumb.onclick = () => __awaiter(this, void 0, void 0, function* () {
                printess.assignImageToNextPossibleFrame(im.id);
                if (forMobile) {
                    closeMobileFullscreenContainer();
                }
            });
        }
        return thumb;
    }
    function getSearchBar(printess, p, container, forMobile, showSearchIcon) {
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
        searchInput.oninput = () => {
            searchBtn.className = "btn btn-primary";
            searchBtn.innerHTML = "";
            searchIcon = printess.getIcon("search-light");
            searchIcon.style.height = "20px";
            searchBtn.appendChild(searchIcon);
            const searchValue = document.getElementById("search-input");
            const list = document.getElementById("search-list") || document.createElement("ul");
            list.className = "list-group position-absolute";
            list.id = "search-list";
            list.style.top = "38px";
            list.style.left = "0";
            list.style.width = "100%";
            list.style.zIndex = "10";
            list.style.boxShadow = "0 2px 5px 0 rgba(0,0,0,.2),0 2px 10px 0 rgba(0,0,0,.1)";
            list.innerHTML = "";
            printess.getImageGroups(p === null || p === void 0 ? void 0 : p.id).filter(g => g !== "Buyer Upload" && g.toLowerCase().includes(searchValue.value.toLowerCase())).forEach(group => {
                const images = printess.getImages(p === null || p === void 0 ? void 0 : p.id);
                if (images === null || images === void 0 ? void 0 : images.filter(i => i.group === group).length) {
                    const listItem = document.createElement("li");
                    listItem.className = "list-group-item search-list-item";
                    listItem.textContent = group;
                    listItem.onclick = () => {
                        const images = printess.getImages(p === null || p === void 0 ? void 0 : p.id);
                        const newImages = images === null || images === void 0 ? void 0 : images.filter(i => i.group === group);
                        renderMyImagesTab(printess, forMobile, p, newImages, container, false);
                    };
                    list.appendChild(listItem);
                }
            });
            if (searchValue.value.trim() === "") {
                list.innerHTML = "";
            }
            searchWrapper.appendChild(list);
        };
        searchBtn.onclick = () => {
            const images = printess.getImages(p === null || p === void 0 ? void 0 : p.id);
            const searchValue = document.getElementById("search-input");
            const newImages = images === null || images === void 0 ? void 0 : images.filter(i => i.group.toLowerCase().includes(searchValue.value.toLocaleLowerCase()));
            if (searchValue.value.trim() === "") {
                renderMyImagesTab(printess, forMobile, p, newImages, container, true);
            }
            else {
                renderMyImagesTab(printess, forMobile, p, newImages, container, false);
            }
        };
        searchBtn.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        searchWrapper.appendChild(searchBtn);
        return searchWrapper;
    }
    function getMobilePropertiesCaption(printess, tabs = uih_currentTabs) {
        var _a;
        if (uih_currentTabId === "LOADING") {
            uih_currentTabId = printess.getInitialTabId() === "#FORMFIELDS" ? (_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id : printess.getInitialTabId();
        }
        let caption = "";
        const currentTab = tabs.filter(t => t.id === uih_currentTabId)[0] || "";
        if (currentTab) {
            caption = currentTab.head || currentTab.caption;
        }
        return caption;
    }
    function renderMobileDialogFullscreen(printess, id, caption, content, addTabsNavigation = true) {
        const container = document.createElement("div");
        container.id = id;
        container.className = "fullscreen-mobile-dialog show-image-list";
        getMobileFullscreenContent(printess, id, container, caption, content, addTabsNavigation);
        document.body.appendChild(container);
    }
    function renderMobilePropertiesFullscreen(printess, id, state) {
        let container = document.querySelector(".fullscreen-add-properties");
        if (!container) {
            container = document.createElement("div");
            container.className = "fullscreen-add-properties image-list-preset";
        }
        else {
            container.innerHTML = "";
            container.className = "fullscreen-add-properties image-list-preset";
        }
        if (state === "open")
            container.className = "fullscreen-add-properties show-image-list";
        if (printess.showTabNavigation()) {
            container.classList.add("mobile-tabs");
            const caption = getMobilePropertiesCaption(printess, uih_currentTabs);
            const propsContainer = document.createElement("div");
            renderTabNavigationProperties(printess, propsContainer, true);
            getMobileFullscreenContent(printess, id, container, caption, propsContainer, true);
        }
        else {
            const groupSnippets = renderGroupSnippets(printess, uih_currentGroupSnippets, true);
            getMobileFullscreenContent(printess, "add-design", container, "ui.addDesign", groupSnippets, false);
        }
        openMobileFullscreenContainer("add-properties");
        document.body.appendChild(container);
    }
    function renderMobileImageListFullscreen(printess, id, title, tabContent, p) {
        let container = document.querySelector(".image-list-fullscreen");
        if (!container) {
            container = document.createElement("div");
            container.className = "image-list-fullscreen image-list-preset";
        }
        else {
            container.innerHTML = "";
            container.className = "image-list-fullscreen image-list-preset";
        }
        getMobileFullscreenContent(printess, id, container, title, tabContent, false, p);
        return container;
    }
    function getMobileFullscreenContent(printess, id, container, title, tabContent, addTabsNavigation, p) {
        var _a;
        const header = document.createElement("div");
        header.className = "image-list-header bg-primary text-light";
        header.innerHTML = printess.gl(title).replace(/\\n/g, " ");
        const exitBtn = printess.getIcon("close");
        exitBtn.style.width = "20px";
        exitBtn.style.height = "24px";
        exitBtn.onclick = () => {
            container === null || container === void 0 ? void 0 : container.classList.remove("show-image-list");
            container === null || container === void 0 ? void 0 : container.classList.add("hide-image-list");
            if (id === "CROPMODAL" || id === "PRICE-INFO") {
                window.setTimeout(() => hideModal(id), 1000);
            }
        };
        header.appendChild(exitBtn);
        const content = document.createElement("div");
        content.className = "mobile-fullscreen-content";
        content.id = (_a = id + "_" + (p === null || p === void 0 ? void 0 : p.id)) !== null && _a !== void 0 ? _a : "";
        content.appendChild(tabContent);
        const tabsContainer = document.createElement("div");
        tabsContainer.className = "tabs-navigation";
        renderTabsNavigation(printess, tabsContainer, true);
        container.appendChild(header);
        container.appendChild(content);
        if (addTabsNavigation)
            container.appendChild(tabsContainer);
    }
    function updateMobilePropertiesFullscreen(printess) {
        const imageListHeader = document.querySelector(".fullscreen-add-properties .image-list-header");
        if (imageListHeader) {
            const caption = getMobilePropertiesCaption(printess, uih_currentTabs);
            imageListHeader.innerHTML = caption.replace(/\\n/g, " ");
            const exitBtn = printess.getIcon("close");
            exitBtn.style.width = "20px";
            exitBtn.style.height = "24px";
            exitBtn.onclick = () => {
                closeMobileFullscreenContainer();
            };
            imageListHeader.appendChild(exitBtn);
        }
        const propsContainer = document.querySelector(".fullscreen-add-properties .mobile-fullscreen-content");
        if (propsContainer) {
            propsContainer.innerHTML = "";
            renderTabNavigationProperties(printess, propsContainer, true);
        }
    }
    function openMobileFullscreenContainer(type) {
        let fullscreenContainer;
        if (type === "add-properties") {
            fullscreenContainer = document.querySelector(".fullscreen-add-properties");
        }
        else {
            fullscreenContainer = document.querySelector(".image-list-fullscreen");
        }
        if (fullscreenContainer) {
            fullscreenContainer.classList.remove("image-list-preset");
            fullscreenContainer.classList.remove("hide-image-list");
            fullscreenContainer.classList.add("show-image-list");
        }
    }
    function closeMobileFullscreenContainer() {
        const fullscreenContainer = document.querySelector(".fullscreen-add-properties.show-image-list") || document.querySelector(".image-list-fullscreen.show-image-list");
        fullscreenContainer === null || fullscreenContainer === void 0 ? void 0 : fullscreenContainer.classList.remove("show-image-list");
        fullscreenContainer === null || fullscreenContainer === void 0 ? void 0 : fullscreenContainer.classList.add("hide-image-list");
    }
    function removeMobileFullscreenContainer() {
        const fullscreenContainer = document.querySelector(".fullscreen-add-properties");
        const imageListContainer = document.querySelector(".image-list-fullscreen");
        if (fullscreenContainer)
            fullscreenContainer.remove();
        if (imageListContainer)
            imageListContainer.remove();
    }
    function renderImageControlButtons(printess, images, p) {
        const forHandwriting = (p === null || p === void 0 ? void 0 : p.kind) === "selection-text-style";
        const container = document.createElement("div");
        container.id = "image-control-buttons";
        container.style.display = "grid";
        container.style.gridTemplateColumns = (images.length > 0 && !forHandwriting) ? "1fr 1fr" : "1fr";
        container.style.gridGap = "5px";
        const tabContent = renderMyImagesTab(printess, true, p, undefined);
        const fullscreenContainer = renderMobileImageListFullscreen(printess, "images-list", "ui.exchangeImage", tabContent, p);
        document.body.appendChild(fullscreenContainer);
        const change = document.createElement("button");
        change.className = "btn btn-outline-primary exchange-image-btn";
        change.textContent = printess.gl("ui.exchangeImage");
        change.onclick = () => {
            openMobileFullscreenContainer("image-list");
        };
        const changeIcon = printess.getIcon("image");
        changeIcon.style.height = "50px";
        change.appendChild(changeIcon);
        const handwritingCaption = forHandwriting ? printess.gl("ui.uploadHandwriting") : "";
        container.appendChild(getImageUploadButton(printess, (p === null || p === void 0 ? void 0 : p.id) || "images", true, true, handwritingCaption));
        if (images.length > 0 && !forHandwriting) {
            container.appendChild(change);
        }
        return container;
    }
    function getDistributionOverlay(printess, forMobile, p, container) {
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
        };
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.textContent = printess.gl("ui.buttonYes");
        ok.onclick = () => __awaiter(this, void 0, void 0, function* () {
            hideModal(id);
            yield printess.distributeImages();
            renderMyImagesTab(printess, forMobile, p, printess.getImages(p === null || p === void 0 ? void 0 : p.id), container);
        });
        footer.appendChild(close);
        footer.appendChild(ok);
        showModal(printess, id, content, printess.gl("ui.distributionDialogTitle"), footer);
    }
    function renderAccordionItem(printess, title, body, hideCollapseIcon) {
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
        if (!forPhotoTab)
            accordionItem.appendChild(header);
        const accordionBtn = document.createElement("button");
        accordionBtn.className = "accordion-button";
        accordionBtn.style.backgroundColor = "white";
        accordionBtn.setAttribute("data-bs-toggle", "collapse");
        accordionBtn.setAttribute("data-bs-target", "#" + bodyId);
        accordionBtn.style.boxShadow = "none";
        accordionBtn.textContent = title;
        accordionBtn.onclick = () => {
            const collapseButtons = document.querySelectorAll("button.accordion-collapse-btn.disabled");
            collapseButtons === null || collapseButtons === void 0 ? void 0 : collapseButtons.forEach(b => b.classList.remove("disabled"));
        };
        header.appendChild(accordionBtn);
        if (hideCollapseIcon)
            accordionBtn.classList.add("no-after");
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
    function renderCollapseButtons(printess) {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "d-flex flex-row";
        const collapseAllButton = document.createElement("button");
        collapseAllButton.className = "btn btn-outline-primary accordion-collapse-btn me-1 mb-3 w-100";
        collapseAllButton.textContent = printess.gl("ui.collapseAll");
        collapseAllButton.onclick = () => {
            const accordionButtons = document.querySelectorAll("button.accordion-button");
            accordionButtons === null || accordionButtons === void 0 ? void 0 : accordionButtons.forEach(b => {
                b.classList.add("collapsed");
            });
            const accordionBodys = document.querySelectorAll("div.accordion-collapse.collapse.show");
            accordionBodys === null || accordionBodys === void 0 ? void 0 : accordionBodys.forEach(b => b.classList.remove("show"));
            collapseAllButton.classList.add("disabled");
            expandAllButton.classList.remove("disabled");
        };
        const expandAllButton = document.createElement("button");
        expandAllButton.className = "btn btn-outline-primary accordion-collapse-btn mb-3 w-100 disabled";
        expandAllButton.textContent = printess.gl("ui.expandAll");
        expandAllButton.onclick = () => {
            const accordionButtons = document.querySelectorAll("button.accordion-button");
            accordionButtons === null || accordionButtons === void 0 ? void 0 : accordionButtons.forEach(b => {
                b.classList.remove("collapsed");
            });
            const accordionBodys = document.querySelectorAll("div.accordion-collapse.collapse");
            accordionBodys === null || accordionBodys === void 0 ? void 0 : accordionBodys.forEach(b => b.classList.add("show"));
            expandAllButton.classList.add("disabled");
            collapseAllButton.classList.remove("disabled");
        };
        buttonWrapper.appendChild(collapseAllButton);
        buttonWrapper.appendChild(expandAllButton);
        return buttonWrapper;
    }
    function renderGroupSnippets(printess, groupSnippets, forMobile) {
        const forPhotoTab = uih_currentTabId === "#PHOTOS" && printess.showTabNavigation();
        const div = document.createElement("div");
        div.className = forMobile ? "group-snippets" : "accordion";
        div.id = "group-snippets";
        if (groupSnippets.length > 0) {
            for (const cluster of groupSnippets) {
                if (forMobile && !forPhotoTab) {
                    const headline = document.createElement("h5");
                    headline.className = "snippet-cluster-name";
                    headline.textContent = cluster.name;
                    div.appendChild(headline);
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
                    thumbDiv.ondragstart = (ev) => {
                        var _a;
                        (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', `${"SNIP:" + snippet.snippetUrl}`);
                    };
                    const priceBox = document.createElement("span");
                    priceBox.className = "badge bg-primary";
                    priceBox.textContent = printess.gl(snippet.priceLabel);
                    if (snippet.priceLabel)
                        thumbDiv.appendChild(priceBox);
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
                    };
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
        }
        else {
            if (groupSnippets.length > 3) {
                const desktop = document.createElement("div");
                desktop.appendChild(renderCollapseButtons(printess));
                desktop.appendChild(div);
                return desktop;
            }
            else {
                return div;
            }
        }
    }
    function getExternalSnippetDiv(printess, layoutSnippets, modalId, forMobile, forLayoutDialog = false) {
        const modalHtml = window.uiHelper.customLayouSnippetRenderCallback(printess, layoutSnippets, forMobile, forLayoutDialog, (templateName, templateVersion, documentName, mode = "layout") => {
            printess.insertTemplateAsLayoutSnippet(templateName, templateVersion, documentName, mode);
            closeLayoutOverlays(printess, forMobile);
        }, () => {
            closeLayoutOverlays(printess, forMobile);
        });
        return modalHtml;
    }
    function renderLayoutSelectionDialog(printess, layoutSnippets, forMobile) {
        const modalId = "layoutSnippetsSelection";
        const templateTitle = printess.getTemplateTitle();
        const title = templateTitle ? printess.gl("ui.selectLayoutTitle", templateTitle) : printess.gl("ui.selectLayoutWithoutTitle");
        const layoutContainer = document.createElement("div");
        layoutContainer.style.height = "calc(100% - 3.5rem)";
        const infoText = document.createElement("p");
        infoText.innerHTML = printess.gl("ui.selectLayoutInfo", printess.getTemplateTitle());
        layoutContainer.appendChild(infoText);
        layoutContainer.appendChild(renderLayoutSnippets(printess, layoutSnippets, forMobile, true));
        showModal(printess, modalId, layoutContainer, title);
    }
    function closeLayoutOverlays(printess, forMobile) {
        const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
        if (myOffcanvas)
            myOffcanvas.click();
        const offCanvas = document.getElementById("layoutOffcanvas");
        if (offCanvas)
            offCanvas.style.visibility = "hidden";
        const layoutsDialog = document.getElementById("layoutSnippetsSelection");
        if (layoutsDialog)
            layoutsDialog.remove();
        if (forMobile && printess.showTabNavigation()) {
            closeMobileFullscreenContainer();
        }
    }
    function renderLayoutSnippets(printess, layoutSnippets, forMobile, forLayoutDialog = false) {
        if (window.uiHelper.customLayouSnippetRenderCallback) {
            const externalSnippetContainer = getExternalSnippetDiv(printess, layoutSnippets, "layoutSnippetsSelection", forMobile !== null && forMobile !== void 0 ? forMobile : uih_currentRender === "mobile", forLayoutDialog);
            if (externalSnippetContainer && externalSnippetContainer.nodeType) {
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
                    priceBox.className = "badge bg-primary";
                    priceBox.textContent = printess.gl(snippet.priceLabel);
                    if (snippet.priceLabel)
                        thumbDiv.appendChild(priceBox);
                    thumbDiv.onclick = () => {
                        const propsDiv = document.getElementById("desktop-properties");
                        if (propsDiv && !forMobile && printess.showTabNavigation()) {
                            uih_snippetsScrollPosition = propsDiv.scrollTop;
                        }
                        printess.insertLayoutSnippet(snippet.snippetUrl);
                        closeLayoutOverlays(printess, forMobile !== null && forMobile !== void 0 ? forMobile : uih_currentRender === "mobile");
                    };
                    clusterDiv.appendChild(thumbDiv);
                }
                if (forLayoutDialog) {
                    container.classList.add("accordion");
                    container.appendChild(renderAccordionItem(printess, cluster.name, clusterDiv, layoutSnippets.length < 2));
                }
                else {
                    container.appendChild(clusterDiv);
                }
            }
        }
        return container;
    }
    let tableEditRow = {};
    let tableEditRowIndex = -1;
    function getTableControl(printess, p, _forMobile) {
        const container = document.createElement("div");
        let hasRow = false;
        if (p.tableMeta) {
            let data = [];
            try {
                data = JSON.parse(p.value.toString() || "[]");
            }
            catch (error) {
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
                for (const row of data) {
                    if (p.tableMeta.tableType !== "calendar-events" || row.month == p.tableMeta.month) {
                        tr = document.createElement("tr");
                        tr.dataset.rowNumber = rowNumber.toString();
                        for (const col of p.tableMeta.columns) {
                            if (p.tableMeta.tableType !== "calendar-events" || (col.name !== "month" && col.name !== "event")) {
                                const td = document.createElement("td");
                                td.innerText = printess.gl(row[col.name].toString());
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
                        tr.onclick = (ele) => {
                            const rowIndex = parseInt(ele.currentTarget.dataset.rowNumber);
                            if (rowIndex >= 0) {
                                for (const row of ele.currentTarget.parentElement.children) {
                                    row.classList.remove("table-active");
                                    ele.currentTarget.classList.add("table-active");
                                }
                            }
                            tableEditRow = data[rowIndex];
                            tableEditRowIndex = rowIndex;
                            renderTableDetails(printess, p, false);
                        };
                        tbody.appendChild(tr);
                        hasRow = true;
                    }
                    rowNumber++;
                }
                table.appendChild(tbody);
                if (hasRow)
                    container.appendChild(table);
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
            };
            container.appendChild(addButton);
        }
        const details = document.createElement("div");
        details.id = "tableDetails_" + p.id;
        details.className = "container-fluid border";
        container.appendChild(details);
        return container;
    }
    function renderTableDetails(printess, p, forMobile) {
        var _a, _b;
        const details = forMobile ? document.createElement("div") : document.getElementById("tableDetails_" + p.id);
        if (!details || !p.tableMeta)
            return document.createElement("div");
        details.innerHTML = "";
        if (((_a = p.tableMeta) === null || _a === void 0 ? void 0 : _a.tableType) === "calendar-events") {
            const group = document.createElement("div");
            group.className = "input-group mb-3";
            for (const col of p.tableMeta.columns) {
                if (col.name === "day") {
                    const dayDiv = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
                    dayDiv.style.flexBasis = "80px";
                    dayDiv.style.marginRight = "10px";
                    group.appendChild(dayDiv);
                }
                else if (col.name === "text") {
                    const text = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
                    text.style.flexGrow = "1";
                    text.style.flexBasis = "80px";
                    text.style.marginRight = "10px";
                    group.appendChild(text);
                }
            }
            details.appendChild(group);
        }
        else {
            for (const col of p.tableMeta.columns) {
                if ((_b = col.list) === null || _b === void 0 ? void 0 : _b.length) {
                    details.appendChild(getTableDetailsDropDown(printess, p, tableEditRowIndex, tableEditRow, col, false, true));
                }
                else {
                    details.appendChild(getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false));
                }
            }
        }
        const submitButton = document.createElement("button");
        submitButton.className = "btn btn-primary mb-3 float-left";
        if (tableEditRowIndex === -1) {
            submitButton.innerText = printess.gl("ui.buttonAdd");
        }
        else {
            submitButton.innerText = printess.gl("ui.buttonSubmit");
        }
        submitButton.onclick = () => {
            var _a, _b;
            if (((_a = p.tableMeta) === null || _a === void 0 ? void 0 : _a.tableType) === "calendar-events" && !tableEditRow.text) {
                getValidationOverlay(printess, [{ boxIds: [], errorCode: "missingEventText", errorValue1: "" }], "done");
                return;
            }
            if (((_b = p.tableMeta) === null || _b === void 0 ? void 0 : _b.tableType) === "calendar-events" && p.tableMeta.month && p.tableMeta.year) {
                if ([4, 6, 9, 11].includes(p.tableMeta.month) && (tableEditRow.day > 30 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "30" }], "done");
                    return;
                }
                else if (p.tableMeta.year % 4 === 0 && p.tableMeta.month === 2 && (tableEditRow.day > 29 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "29" }], "done");
                    return;
                }
                else if (p.tableMeta.year % 4 > 0 && p.tableMeta.month === 2 && (tableEditRow.day > 28 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "28" }], "done");
                    return;
                }
                else if (tableEditRow.day < 1 || tableEditRow.day > 31 || !Number(tableEditRow.day)) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "31" }], "done");
                    return;
                }
            }
            const data = JSON.parse(p.value.toString()) || [];
            if (tableEditRowIndex === -1) {
                data.push(tableEditRow);
            }
            else {
                data[tableEditRowIndex] = tableEditRow;
            }
            p.value = JSON.stringify(data);
            printess.setProperty(p.id, p.value);
            details.innerHTML = "";
        };
        details.appendChild(submitButton);
        const cancelButton = document.createElement("button");
        cancelButton.className = "btn btn-secondary mb-3 ml-3";
        cancelButton.style.marginLeft = "20px";
        cancelButton.innerText = printess.gl("ui.buttonCancel");
        cancelButton.onclick = () => {
            details.innerHTML = "";
            tableEditRowIndex = -1;
        };
        details.appendChild(cancelButton);
        if (tableEditRowIndex !== -1) {
            const deleteButton = document.createElement("button");
            deleteButton.className = "btn btn-danger mb-3 ml-3";
            deleteButton.style.marginLeft = "20px";
            deleteButton.innerText = printess.gl("ui.buttonRemove");
            deleteButton.onclick = () => {
                const data = JSON.parse(p.value.toString()) || [];
                data.splice(tableEditRowIndex, 1);
                p.value = JSON.stringify(data);
                printess.setProperty(p.id, p.value);
                details.innerHTML = "";
            };
            details.appendChild(deleteButton);
        }
        return details;
    }
    function getTableDetailsShortList(printess, p, rowIndex, row, col) {
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
                setTableValue(col, f);
                if (col.list) {
                    list.querySelectorAll("a").forEach(a => a.classList.remove("active"));
                    a.classList.add("active");
                }
            };
            list.appendChild(a);
        }
        return list;
    }
    function getTableDetailsDropDown(printess, p, rowIndex, row, col, asList, fullWidth = true) {
        var _a;
        const dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
        const ddContent = document.createElement("ul");
        const value = row[col.name];
        if (col.list) {
            const selectedItem = (_a = col.list.filter(s => s == value)[0]) !== null && _a !== void 0 ? _a : null;
            const button = document.createElement("button");
            button.className = "btn btn-light dropdown-toggle";
            if (fullWidth) {
                button.classList.add("full-width");
            }
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
            button.setAttribute("aria-expanded", "false");
            if (selectedItem) {
                button.appendChild(getTableDropdownItemContent(printess, value));
            }
            dropdown.appendChild(button);
            if (asList) {
                ddContent.classList.add("list-group");
            }
            else {
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
                            li.classList.add("active");
                        }
                    }
                };
                a.appendChild(getTableDropdownItemContent(printess, entry));
                li.appendChild(a);
                ddContent.appendChild(li);
            }
            dropdown.appendChild(ddContent);
        }
        if (asList) {
            return ddContent;
        }
        else {
            return addLabel(printess, dropdown, p.id, false, p.kind, col.label || col.name);
        }
    }
    function getTableDropdownItemContent(printess, value) {
        const div = document.createElement("div");
        div.classList.add("dropdown-list-entry");
        const label = document.createElement("div");
        label.classList.add("dropdown-list-label");
        label.innerText = printess.gl(value.toString());
        div.appendChild(label);
        return div;
    }
    function getTableTextBox(printess, p, rowIndex, row, col, forMobile) {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = row[col.name];
        inp.autocomplete = "off";
        inp.autocapitalize = "off";
        inp.spellcheck = false;
        inp.oninput = () => {
            setTableValue(col, inp.value);
        };
        if (forMobile) {
            inp.classList.add("form-control");
            return inp;
        }
        else {
            const r = addLabel(printess, inp, p.id, forMobile, p.kind, col.label || col.name);
            return r;
        }
    }
    function setTableValue(col, newValue) {
        tableEditRow[col.name];
        if (col.data === "number" && typeof newValue !== "number") {
            tableEditRow[col.name] = isNaN(+newValue) ? 0 : +newValue;
        }
        else if (col.data === "boolean" && typeof newValue !== "boolean") {
            tableEditRow[col.name] = !!(newValue);
        }
        else {
            tableEditRow[col.name] = newValue;
        }
    }
    function getMobileUiDiv() {
        let mobileUi = document.querySelector(".mobile-ui");
        if (!mobileUi) {
            mobileUi = document.createElement("div");
            mobileUi.className = "mobile-ui";
            document.body.appendChild(mobileUi);
        }
        return mobileUi;
    }
    function getMobileNavbarDiv() {
        let mobileNav = document.querySelector(".mobile-navbar");
        if (!mobileNav) {
            mobileNav = document.createElement("nav");
            mobileNav.className = "mobile-navbar bg-primary";
            document.body.appendChild(mobileNav);
        }
        return mobileNav;
    }
    function renderMobileUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets, layoutSnippets = uih_currentLayoutSnippets, tabs = uih_currentTabs, skipAutoSelect = false) {
        var _a, _b, _c;
        uih_currentTabs = tabs;
        uih_currentGroupSnippets = groupSnippets;
        uih_currentLayoutSnippets = layoutSnippets;
        uih_currentState = state;
        uih_currentProperties = properties;
        uih_currentRender = "mobile";
        const mobileUi = getMobileUiDiv();
        mobileUi.innerHTML = "";
        const desktopProperties = document.getElementById("desktop-properties");
        if (desktopProperties) {
            desktopProperties.innerHTML = "";
        }
        const desktopPagebar = document.getElementById("desktop-pagebar");
        if (desktopPagebar) {
            desktopPagebar.innerHTML = "";
        }
        removeDesktopTabsNavigation();
        const closeButton = mobileUi.querySelector(".close-control-host-button");
        if (closeButton) {
            mobileUi.removeChild(closeButton);
        }
        const printessBuyerPropertiesButton = document.getElementById("printessBuyerPropertiesButton");
        if (printessBuyerPropertiesButton) {
            printessBuyerPropertiesButton.style.display = "none";
        }
        if ((printess.spreadCount() > 1 && printess.pageNavigationDisplay() === "numbers") || (printess.pageNavigationDisplay() === "icons")) {
            document.body.classList.add("has-mobile-page-bar");
        }
        else {
            document.body.classList.remove("has-mobile-page-bar");
        }
        if (printess.pageNavigationDisplay() === "icons") {
            document.body.classList.add("has-mobile-icon-pagebar");
        }
        else {
            document.body.classList.remove("has-mobile-icon-pagebar");
        }
        let autoSelectButton = null;
        if (state !== "add") {
            const buttons = getMobileButtons(printess, undefined, undefined, skipAutoSelect);
            mobileUi.innerHTML = "";
            mobileUi.appendChild(buttons.div);
            autoSelectButton = buttons.autoSelectButton;
            setPropertyVisibilities(printess);
        }
        const controlHost = document.createElement("div");
        controlHost.className = "mobile-control-host";
        controlHost.id = "mobile-control-host";
        mobileUi.appendChild(controlHost);
        mobileUi.appendChild(getMobilePropertyNavButtons(printess, state, autoSelectButton !== null));
        if (printess.showTabNavigation()) {
            updateMobilePropertiesFullscreen(printess);
        }
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton && printess.showTabNavigation()) {
            layoutsButton.textContent = printess.gl("ui.changeLayout");
            layoutsButton.style.visibility = "hidden";
        }
        const closeLayoutsButton = document.getElementById("closeLayoutOffCanvas");
        if (closeLayoutsButton && printess.showTabNavigation()) {
            closeLayoutsButton.click();
        }
        if (printess.hasSelection()) {
            sessionStorage.setItem("editableFrames", "hint closed");
            const framePulse = document.getElementById("frame-pulse");
            if (framePulse)
                (_a = framePulse.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(framePulse);
        }
        renderUiButtonHints(printess, mobileUi, state, true);
        renderEditableFramesHint(printess);
        if (!uih_layoutSelectionDialogHasBeenRendered && layoutSnippets.length > 0 && printess.showLayoutsDialog()) {
            uih_layoutSelectionDialogHasBeenRendered = true;
            renderLayoutSelectionDialog(printess, layoutSnippets, true);
        }
        if (state === "document" && printess.hasLayoutSnippets() && !sessionStorage.getItem("changeLayout")) {
            toggleChangeLayoutButtonHint();
        }
        if ((groupSnippets.length > 0 || (layoutSnippets.length > 0 && printess.showTabNavigation())) && state !== "add") {
            mobileUi.appendChild(getMobilePlusButton(printess));
        }
        if (state !== "document") {
            mobileUi.appendChild(getMobilePropertyNavButtons(printess, state, false));
        }
        else {
            if (uih_viewportOffsetTop) {
                return;
            }
            if (autoSelectButton) {
                if (((_b = uih_lastMobileState === null || uih_lastMobileState === void 0 ? void 0 : uih_lastMobileState.externalProperty) === null || _b === void 0 ? void 0 : _b.kind) === "selection-text-style") {
                    if (properties.length && properties[0].kind === "selection-text-style") {
                        if (((_c = autoSelectButton.newState) === null || _c === void 0 ? void 0 : _c.metaProperty) && autoSelectButton.newState.metaProperty === (uih_lastMobileState === null || uih_lastMobileState === void 0 ? void 0 : uih_lastMobileState.metaProperty)) {
                            return;
                        }
                    }
                }
            }
        }
        printess.setZoomMode(printess.isTextEditorOpen() ? "frame" : "spread");
        resizeMobileUi(printess);
    }
    function toggleChangeLayoutButtonHint() {
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton) {
            layoutsButton.classList.add("layouts-button-pulse");
            layoutsButton.onclick = (e) => {
                var _a;
                e.preventDefault();
                const uiHintAlert = document.getElementById("ui-hint-changeLayout");
                (_a = uiHintAlert === null || uiHintAlert === void 0 ? void 0 : uiHintAlert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(uiHintAlert);
                layoutsButton.classList.remove("layouts-button-pulse");
                sessionStorage.setItem("changeLayout", "hint closed");
                layoutsButton.onclick = null;
            };
        }
    }
    let renderEditableFramesHintTimer = 0;
    function renderEditableFramesHint(printess) {
        const showEditableFramesHint = printess.uiHintsDisplay().includes("editableFrames") && !sessionStorage.getItem("editableFrames");
        if (showEditableFramesHint) {
            renderEditableFramesHintTimer = window.setTimeout(() => {
                renderEditableFramesHintTimer = 0;
                printess.getFrameUiHintPosition().then((frame) => {
                    const spread = document.querySelector("div.printess-content");
                    let pulseDiv = document.getElementById("frame-pulse");
                    if (!pulseDiv) {
                        pulseDiv = document.createElement("div");
                        pulseDiv.classList.add("frame-hint-pulse");
                        pulseDiv.id = "frame-pulse";
                        pulseDiv.style.position = "absolute";
                    }
                    pulseDiv.style.left = frame.left;
                    pulseDiv.style.top = frame.top;
                    const pointer = printess.getIcon("hand-pointer-light");
                    pointer.classList.add("frame-hint-pointer");
                    pulseDiv.appendChild(pointer);
                    spread === null || spread === void 0 ? void 0 : spread.appendChild(pulseDiv);
                });
            }, 1000);
        }
    }
    function renderUiButtonHints(printess, container, state = uih_currentState, forMobile) {
        const showLayoutsHint = printess.showTabNavigation() && forMobile || !printess.showTabNavigation();
        const uiHints = [{
                header: "expertMode",
                msg: printess.gl("ui.expertModeHint"),
                position: "fixed",
                top: !forMobile && printess.pageNavigationDisplay() === "icons" ? "50px" : "calc(var(--editor-pagebar-height) + 5px)",
                left: !forMobile && printess.pageNavigationDisplay() === "icons" ? "calc(100% - 450px)" : "30px",
                color: "danger",
                show: printess.uiHintsDisplay().includes("expertMode") && !sessionStorage.getItem("expertMode") && printess.hasExpertButton(),
                task: () => {
                    const expertBtn = document.getElementById("expert-button");
                    if (expertBtn) {
                        if (forMobile) {
                            expertBtn.classList.add("btn-light");
                            expertBtn.classList.remove("btn-outline-light");
                        }
                        else {
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
                show: printess.uiHintsDisplay().includes("groupSnippets") && !sessionStorage.getItem("addDesign") && uih_currentGroupSnippets.length > 0 && forMobile,
                task: () => {
                    sessionStorage.setItem("addDesign", "hint closed");
                    renderMobilePropertiesFullscreen(printess, "add-design", "open");
                }
            }, {
                header: "changeLayout",
                msg: printess.gl("ui.changeLayoutHint"),
                position: "fixed",
                top: printess.hasExpertButton() && forMobile ? "calc(50% - 100px)" : "calc(50% - 150px)",
                left: "55px",
                color: "primary",
                show: printess.uiHintsDisplay().includes("layoutSnippets") && !sessionStorage.getItem("changeLayout") && printess.hasLayoutSnippets() && showLayoutsHint && !forMobile,
                task: () => {
                    const layoutBtn = document.querySelector(".show-layouts-button");
                    if (layoutBtn) {
                        layoutBtn.classList.remove("layouts-button-pulse");
                    }
                    const offCanvas = document.querySelector("div#layoutOffcanvas");
                    if (offCanvas) {
                        offCanvas.style.visibility = "visible";
                        offCanvas.classList.add("show");
                    }
                    const offCanvasButton = document.querySelector("button#closeLayoutOffCanvas");
                    if (offCanvasButton && offCanvas) {
                        offCanvasButton.onclick = () => offCanvas.classList.remove("show");
                    }
                }
            }];
        const expertAlert = document.getElementById("ui-hint-expertMode");
        if (!printess.hasExpertButton() && expertAlert) {
            expertAlert.remove();
        }
        const layoutsButton = document.querySelector("button.show-layouts-button");
        const layoutAlert = document.getElementById("ui-hint-changeLayout");
        if ((layoutsButton.style.visibility === "hidden" || !layoutsButton) && layoutAlert) {
            layoutAlert.remove();
        }
        uiHints.filter(h => h.show).forEach(hint => {
            let alert = document.getElementById("ui-hint-" + hint.header);
            if (alert) {
            }
            else {
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
                    var _a;
                    sessionStorage.setItem(hint.header, "hint closed");
                    (_a = alert === null || alert === void 0 ? void 0 : alert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(alert);
                    if (hint.header === "changeLayout") {
                        const layoutsButton = document.querySelector(".show-layouts-button");
                        if (layoutsButton) {
                            layoutsButton.onclick = (e) => {
                                e.preventDefault();
                                layoutsButton.classList.remove("layouts-button-pulse");
                                layoutsButton.onclick = null;
                            };
                        }
                    }
                };
                const flexWrapper = document.createElement("div");
                flexWrapper.className = "d-flex w-100 justify-content-end mt-1";
                const open = document.createElement("span");
                open.className = "layout-hint-open";
                open.textContent = hint.header === "expertMode" ? "Turn On" : "Show Me";
                open.onclick = () => {
                    var _a;
                    sessionStorage.setItem(hint.header, "hint closed");
                    (_a = alert === null || alert === void 0 ? void 0 : alert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(alert);
                    hint.task();
                };
                flexWrapper.appendChild(open);
                alert.appendChild(title);
                alert.appendChild(text);
                alert.appendChild(close);
                alert.appendChild(flexWrapper);
                container.appendChild(alert);
            }
        });
    }
    function getMobilePlusButton(printess) {
        const button = document.createElement("div");
        button.className = "mobile-property-plus-button";
        const circle = document.createElement("div");
        circle.className = "mobile-property-circle";
        circle.onclick = () => {
            sessionStorage.setItem("addDesign", "hint closed");
            renderMobilePropertiesFullscreen(printess, "add-design", "open");
        };
        if (!sessionStorage.getItem("addDesign")) {
            circle.classList.add("mobile-property-plus-pulse");
        }
        else {
            circle.classList.remove("mobile-property-plus-pulse");
        }
        const icon = printess.getIcon("plus");
        circle.appendChild(icon);
        button.appendChild(circle);
        return button;
    }
    function getMobileNavButton(btn, circleWhiteBg) {
        const button = document.createElement("div");
        button.className = "mobile-property-nav-button";
        const circle = document.createElement("div");
        circle.className = "mobile-property-circle bg-primary text-white";
        circle.onclick = () => btn.task();
        if (circleWhiteBg) {
            circle.className = "mobile-property-circle bg-white text-primary border border-primary";
        }
        circle.appendChild(btn.icon);
        button.appendChild(circle);
        return button;
    }
    function getMobilePropertyNavButtons(printess, state, fromAutoSelect, hasControlHost = false) {
        let container = document.getElementById("mobile-nav-buttons-container");
        if (container) {
            container.innerHTML = "";
        }
        else {
            container = document.createElement("div");
            container.id = "mobile-nav-buttons-container";
            container.className = "mobile-property-button-container";
        }
        const buttons = {
            add: {
                name: "closeNewSnippetList",
                icon: printess.getIcon("carret-down-solid"),
                task: () => { printess.clearSelection(); resizeMobileUi(printess); }
            },
            previous: {
                name: "previous",
                icon: printess.getIcon("arrow-left"),
                task: () => {
                    var _a;
                    printess.previousStep();
                    getCurrentTab(printess, (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) - 1), true);
                }
            },
            clear: {
                name: "clear",
                icon: printess.getIcon("check"),
                task: () => { printess.clearSelection(); resizeMobileUi(printess); }
            },
            frame: {
                name: "frame",
                icon: printess.getIcon("check"),
                task: () => { printess.setZoomMode("spread"); renderMobileUi(printess, uih_currentProperties, "frames", undefined, undefined, undefined, true); }
            },
            document: {
                name: "document",
                icon: printess.getIcon("check"),
                task: () => renderMobileUi(printess, uih_currentProperties, "document", undefined, undefined, undefined, true)
            },
            next: {
                name: "next",
                icon: printess.getIcon("arrow-right"),
                task: () => {
                    var _a;
                    gotoNextStep(printess);
                    getCurrentTab(printess, (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) + 1), true);
                }
            },
            basket: {
                name: "basket",
                icon: printess.getIcon("shopping-cart-add"),
                task: () => addToBasket(printess)
            }
        };
        if (state === "add") {
            const add = getMobileNavButton(buttons.add, printess.hasSteps());
            add.classList.add("close-designs-button");
            container.appendChild(add);
        }
        else if (state === "text") {
            container.appendChild(getMobileNavButton(buttons.clear, false));
        }
        else if (state === "details" || state === "frames") {
            if (printess.isCurrentStepActive()) {
                if (uih_currentProperties.length > 1 && state === "details") {
                    container.appendChild(getMobileNavButton(buttons.frame, true));
                }
                else if (printess.hasPreviousStep()) {
                    container.appendChild(getMobileNavButton(buttons.previous, false));
                }
            }
            else {
                if ((printess.buyerCanHaveEmptySelection() && printess.hasSelection()) || (printess.hasBackground() && printess.hasSelection())) {
                    if (uih_currentProperties.length > 1 && state === "details") {
                        container.appendChild(getMobileNavButton(buttons.frame, printess.hasSteps()));
                    }
                    else {
                        container.appendChild(getMobileNavButton(buttons.clear, printess.hasSteps()));
                    }
                }
                else if (printess.hasPreviousStep()) {
                    container.appendChild(getMobileNavButton(buttons.previous, false));
                }
            }
            if (printess.hasSteps()) {
                if (printess.hasNextStep()) {
                    container.appendChild(getMobileNavButton(buttons.next, false));
                }
                else {
                    container.appendChild(getMobileNavButton(buttons.basket, false));
                }
            }
        }
        else if (state === "document") {
            if (printess.hasSteps()) {
                if (printess.hasPreviousStep()) {
                    container.appendChild(getMobileNavButton(buttons.previous, false));
                }
                if (printess.hasNextStep()) {
                    container.appendChild(getMobileNavButton(buttons.next, false));
                }
                else {
                    container.appendChild(getMobileNavButton(buttons.basket, false));
                }
            }
            return container;
        }
        return container;
    }
    function renderMobileNavBar(printess) {
        const navBar = getMobileNavbarDiv();
        navBar.innerHTML = "";
        const nav = document.createElement("div");
        nav.className = "navbar navbar-dark";
        nav.style.flexWrap = "nowrap";
        const basketBtnBehaviour = printess.getBasketButtonBehaviour();
        const showTitle = printess.hasSteps();
        const isBookMode = printess.canAddSpreads() || printess.canRemoveSpreads();
        const noStepsMenu = printess.showUndoRedo() && !printess.hasSteps() && printess.hasExpertButton() && (basketBtnBehaviour === "go-to-preview" || isBookMode > 0);
        const showUndoRedo = printess.showUndoRedo() && !printess.hasSteps() && !printess.hasPreviewBackButton();
        const showCloseBtn = !printess.hasSteps() && (!printess.showUndoRedo() || !showTitle);
        const showExpertBtn = printess.hasExpertButton() && !noStepsMenu && !printess.hasSteps();
        const showExpertBtnWithSteps = printess.hasExpertButton() && printess.hasSteps() && printess.stepHeaderDisplay() === "never";
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
            }
            else {
                if (!noStepsMenu && showCloseBtn) {
                    const callback = printess.getBackButtonCallback();
                    btn.className = "btn btn-sm text-white me-2 ms-2";
                    btn.textContent = printess.gl("ui.buttonBack");
                    const caption = printess.gl("ui.buttonBack");
                    const icon = printess.gl("ui.buttonBackIcon");
                    if (icon) {
                        const svg = printess.getIcon(icon);
                        svg.style.height = "24px";
                        if (caption) {
                            svg.style.float = "left";
                            svg.style.marginRight = "10px";
                        }
                        btn.appendChild(svg);
                    }
                    if (!callback)
                        btn.classList.add("disabled");
                    btn.onclick = () => {
                        if (printess.isInDesignerMode()) {
                            if (callback) {
                                handleBackButtonCallback(printess, callback);
                            }
                        }
                        else {
                            getCloseEditorDialog(printess);
                        }
                    };
                }
                else {
                    const ico = printess.getIcon("burger-menu");
                    ico.classList.add("icon");
                    btn.appendChild(ico);
                    let showMenuList = false;
                    btn.onclick = () => {
                        showMenuList = !showMenuList;
                        const menuList = document.getElementById("mobile-menu-list");
                        if (menuList)
                            navBar.removeChild(menuList);
                        if (showMenuList)
                            navBar.appendChild(getMobileMenuList(printess));
                    };
                }
                if (showExpertBtn || showExpertBtnWithSteps) {
                    const expertBtn = getExpertModeButton(printess, true);
                    container.appendChild(btn);
                    container.appendChild(expertBtn);
                    nav.appendChild(container);
                }
                else {
                    nav.appendChild(btn);
                }
            }
        }
        if (showTitle) {
            const s = printess.getStep();
            const hd = printess.stepHeaderDisplay();
            if (s && hd !== "never") {
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
                    step.appendChild(h6);
                }
                if (hd === "tabs list" || hd === "badge list") {
                    if (hd === "badge list") {
                        step.classList.add("badge-list-mobile");
                    }
                    step.classList.add("step-tabs-list");
                    step.id = "step-tab-list";
                    step.appendChild(getStepsTabsList(printess, true, hd));
                    const scrollRight = document.createElement("div");
                    scrollRight.className = "scroll-right-indicator";
                    scrollRight.style.backgroundImage = "linear-gradient(to right, rgba(168,168,168,0), var(--bs-primary))";
                    scrollRight.style.display = "inline-block";
                    step.appendChild(scrollRight);
                }
                nav.appendChild(step);
            }
            else {
                document.body.classList.remove("mobile-has-steps-header");
            }
        }
        else if (showUndoRedo) {
            const undoredo = document.createElement("div");
            undoredo.style.display = "flex";
            {
                const btn = document.createElement("button");
                btn.className = "btn btn-sm";
                const ico = printess.getIcon("undo-arrow");
                ico.classList.add("icon");
                btn.onclick = () => {
                    printess.undo();
                };
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
                };
                btn.appendChild(ico);
                undoredo.appendChild(btn);
            }
            nav.appendChild(undoredo);
        }
        const wrapper = document.createElement("div");
        wrapper.className = "d-flex";
        if (basketBtnBehaviour === "go-to-preview" && printess.stepHeaderDisplay() !== "tabs list" && printess.stepHeaderDisplay() !== "badge list") {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm ms-2 main-button";
            btn.classList.add("btn-outline-light");
            btn.innerText = printess.gl("ui.buttonPreview");
            btn.onclick = () => {
                if (validateAllInputs(printess) === true) {
                    printess.gotoNextPreviewDocument();
                }
            };
            wrapper.appendChild(btn);
        }
        {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm ms-2 me-2 main-button";
            if (printess.hasSteps() && !printess.hasNextStep()) {
                btn.classList.add("main-button-pulse");
            }
            const icon = printess.gl("ui.buttonBasketIcon") || "shopping-cart-add";
            const ico = printess.getIcon(icon);
            ico.classList.add("big-icon");
            btn.appendChild(ico);
            btn.onclick = () => addToBasket(printess);
            wrapper.appendChild(btn);
        }
        nav.appendChild(wrapper);
        navBar.appendChild(nav);
        return navBar;
    }
    function getMobileMenuList(printess) {
        const isBookMode = printess.canAddSpreads() || printess.canRemoveSpreads();
        const noStepsMenu = printess.showUndoRedo() && !printess.hasSteps() && printess.hasExpertButton() && (printess.getBasketButtonBehaviour() === "go-to-preview" || isBookMode > 0);
        const listWrapper = document.createElement("div");
        listWrapper.id = "mobile-menu-list";
        const menuList = document.createElement("div");
        menuList.className = "btn-group w-100 d-flex flex-wrap bg-primary";
        menuList.style.position = "absolute";
        menuList.style.top = "48px";
        menuList.style.left = "0px";
        menuList.style.zIndex = "1000";
        const addSpreads = printess.canAddSpreads();
        const menuItems = [
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
                    }
                    else {
                        getCloseEditorDialog(printess);
                    }
                }
            }, {
                id: "expert",
                title: "ui.expertMode",
                icon: "pen-swirl",
                show: (printess.hasExpertButton() && printess.hasSteps() && printess.stepHeaderDisplay() !== "never") || noStepsMenu,
                disabled: false,
                task: () => {
                    if (printess.isInExpertMode()) {
                        printess.leaveExpertMode();
                    }
                    else {
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
            },
            {
                id: "previous",
                title: "ui.buttonPrevStep",
                icon: "arrow-left",
                disabled: !printess.hasPreviousStep(),
                show: printess.hasSteps(),
                task: () => {
                    var _a;
                    printess.previousStep();
                    if ((printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "badge list")) {
                        const tabsListScrollbar = document.getElementById("tabs-list-scrollbar");
                        const curStepTab = document.getElementById("tab-step-" + (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) - 1));
                        setTabScrollPosition(tabsListScrollbar, curStepTab, true);
                    }
                }
            }, {
                id: "next",
                title: "ui.buttonNext",
                icon: "arrow-right",
                disabled: !printess.hasNextStep(),
                show: printess.hasSteps(),
                task: () => {
                    var _a;
                    gotoNextStep(printess);
                    getCurrentTab(printess, (Number((_a = printess.getStep()) === null || _a === void 0 ? void 0 : _a.index) + 1), true);
                }
            },
            {
                id: "firstStep",
                title: "ui.buttonFirstStep",
                icon: printess.previewStepsCount() > 0 ? "primary" : "angle-double-left",
                disabled: !printess.hasSteps() || !printess.hasPreviousStep(),
                show: printess.hasSteps(),
                task: () => {
                    printess.gotoFirstStep();
                    getCurrentTab(printess, 0, true);
                }
            },
            {
                id: "lastStep",
                title: printess.previewStepsCount() > 0 ? "ui.buttonPreview" : "ui.buttonLastStep",
                icon: printess.previewStepsCount() > 0 ? "preview-doc" : "angle-double-right",
                disabled: !printess.hasNextStep(),
                show: printess.hasSteps(),
                task: () => {
                    var _a, _b;
                    if (validateAllInputs(printess) === true) {
                        if (printess.previewStepsCount() > 0) {
                            printess.gotoPreviewStep();
                        }
                        else {
                            printess.gotoLastStep();
                            getCurrentTab(printess, (_b = (_a = printess.lastStep()) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0, true);
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
                if (mi.disabled)
                    item.classList.add("disabled");
                if (mi.id === "next" || (printess.previewStepsCount() === 0 && mi.id === "lastStep"))
                    item.classList.add("reverse-menu-btn-content");
                item.style.border = "1px solid rgba(0,0,0,.125)";
                if (hasExpertButton || noStepsMenu) {
                    item.style.minWidth = "50%";
                }
                else {
                    if (idx < 4)
                        item.style.minWidth = "33%";
                    if (idx >= 4)
                        item.style.minWidth = "50%";
                }
                if (printess.isInExpertMode() && mi.id === "expert") {
                    item.classList.remove("btn-primary");
                    item.classList.add("btn-light");
                }
                if (mi.id === "back" && !printess.showUndoRedo() && !hasExpertButton && !noStepsMenu)
                    item.style.minWidth = "100%";
                const span = document.createElement("span");
                span.textContent = printess.gl(mi.title);
                if (mi.icon) {
                    const icon = printess.getIcon(mi.icon);
                    icon.style.width = "15px";
                    icon.style.height = "15px";
                    icon.style.marginRight = "10px";
                    if (mi.id === "next" || (printess.previewStepsCount() === 0 && mi.id === "lastStep")) {
                        icon.style.marginLeft = "10px";
                        icon.style.marginRight = "0px";
                    }
                    if (printess.previewStepsCount() === 0 && (mi.id === "firstStep" || mi.id === "lastStep")) {
                        icon.style.width = "20px";
                        icon.style.height = "20px";
                    }
                    item.appendChild(icon);
                }
                item.appendChild(span);
                item.onclick = () => {
                    var _a;
                    const list = document.getElementById("mobile-menu-list");
                    if (list)
                        (_a = list.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(list);
                    mi.task();
                };
                menuList.appendChild(item);
            }
        });
        listWrapper.appendChild(menuList);
        return listWrapper;
    }
    function getMobilePageBarDiv() {
        let pagebar = document.querySelector(".mobile-pagebar");
        if (!pagebar) {
            pagebar = document.createElement("div");
            pagebar.className = "mobile-pagebar";
            document.body.appendChild(pagebar);
        }
        else {
            pagebar.innerHTML = "";
        }
        return pagebar;
    }
    function getMobilePriceBarDiv(printess) {
        let pricebar = document.querySelector(".mobile-pricebar");
        if (!pricebar) {
            pricebar = document.createElement("div");
            pricebar.className = "mobile-pricebar";
            document.body.appendChild(pricebar);
        }
        else {
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
        let opener = document.querySelector(".mobile-price-display-opener");
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
        }
        else {
            opener.classList.remove("hidden");
        }
        const closer = document.createElement("div");
        closer.className = "price-display-side-closer";
        const closeIco = printess.getIcon("close");
        closeIco.classList.add("close-icon");
        closer.appendChild(closeIco);
        closer.ontouchstart = () => {
            opener === null || opener === void 0 ? void 0 : opener.classList.remove("hidden");
            if (pricebar)
                pricebar.classList.add("closed");
            uih_mobilePriceDisplay = "closed";
            resizeMobileUi(printess);
        }, {
            passive: true
        };
        closer.onmousedown = () => {
            opener === null || opener === void 0 ? void 0 : opener.classList.remove("hidden");
            if (pricebar)
                pricebar.classList.add("closed");
            uih_mobilePriceDisplay = "closed";
            resizeMobileUi(printess);
        };
        opener.ontouchstart = () => {
            if (pricebar)
                pricebar.classList.remove("closed");
            uih_mobilePriceDisplay = "open";
            resizeMobileUi(printess);
            opener === null || opener === void 0 ? void 0 : opener.classList.add("hidden");
        }, {
            passive: true
        };
        opener.onmousedown = () => {
            if (pricebar)
                pricebar.classList.remove("closed");
            uih_mobilePriceDisplay = "open";
            resizeMobileUi(printess);
            opener === null || opener === void 0 ? void 0 : opener.classList.add("hidden");
        };
        pricebar.appendChild(closer);
    }
    function resizeMobileUi(printess) {
        if (uih_autoSelectPending)
            return;
        const mobileUi = getMobileUiDiv();
        const controlHost = document.getElementById("mobile-control-host");
        if (mobileUi && controlHost) {
            const controlHostHeight = controlHost.offsetHeight;
            const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
            let mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");
            const mobilePriceBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pricebar-height").trim().replace("px", "") || "");
            const mobileButtonBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-buttonbar-height").trim().replace("px", "") || "");
            if (printess.pageNavigationDisplay() === "icons") {
                mobilePageBarHeight = 100;
            }
            if (mobileButtonBarHeight > 15) {
                if (document.body.classList.contains("no-mobile-button-bar")) {
                    debugger;
                }
            }
            const printessDiv = document.getElementById("desktop-printess-container");
            if (printessDiv) {
                const viewPortHeight = uih_viewportHeight ? uih_viewportHeight : window.visualViewport ? window.visualViewport.height : window.innerHeight;
                const viewPortWidth = uih_viewportWidth ? uih_viewportWidth : window.visualViewport ? window.visualViewport.width : window.innerWidth;
                const viewPortTopOffset = uih_viewportOffsetTop;
                const mobileUiHeight = (mobileButtonBarHeight + controlHostHeight + 2);
                let printessHeight = viewPortHeight - mobileUiHeight;
                let printessTop = viewPortTopOffset;
                const isInEddiMode = printess.isSoftwareKeyBoardExpanded() || (uih_currentProperties.length === 1 && uih_currentProperties[0].kind === "selection-text-style");
                let showToolBar = false;
                let showPageBar = false;
                let showPriceBar = false;
                const toolBar = document.querySelector(".mobile-navbar");
                const pageBar = document.querySelector(".mobile-pagebar");
                const priceBar = document.querySelector(".mobile-pricebar");
                const priceBarOpener = document.querySelector(".mobile-price-display-opener");
                if (pageBar && printess.pageNavigationDisplay() === "icons") {
                    pageBar.style.height = mobilePageBarHeight + "px";
                }
                const hidePageAndToolbar = printessHeight < 450 && controlHostHeight > 10 || isInEddiMode || viewPortTopOffset > 0;
                showToolBar = !hidePageAndToolbar || printess.neverHideMobileToolbar();
                showPageBar = !hidePageAndToolbar;
                showPriceBar = !hidePageAndToolbar;
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
                const activeFFId = getActiveFormFieldId();
                const focusSelection = printess.getZoomMode() === "frame";
                if ((focusSelection && activeFFId !== uih_lastFormFieldId) || uih_lastZoomMode !== printess.getZoomMode() || uih_lastMobileUiHeight !== mobileUiHeight || printessTop !== uih_lastPrintessTop || printessHeight !== uih_lastPrintessHeight || viewPortWidth !== uih_lastPrintessWidth) {
                    uih_lastMobileUiHeight = mobileUiHeight;
                    uih_lastPrintessTop = printessTop;
                    uih_lastPrintessHeight = printessHeight;
                    uih_lastPrintessWidth = viewPortWidth;
                    uih_lastFormFieldId = activeFFId;
                    uih_lastZoomMode = printess.getZoomMode();
                    printessDiv.style.position = "fixed";
                    printessDiv.style.left = "0";
                    printessDiv.style.right = "0";
                    printessDiv.style.width = "";
                    printessDiv.style.bottom = "";
                    printessDiv.style.height = printessHeight + "px";
                    printessDiv.style.top = printessTop + "px";
                    mobileUi.style.bottom = "";
                    mobileUi.style.top = (viewPortTopOffset + viewPortHeight - mobileUiHeight) + "px";
                    mobileUi.style.height = mobileUiHeight + "px;";
                    if (toolBar) {
                        if (showToolBar) {
                            toolBar.style.visibility = "visible";
                        }
                        else {
                            toolBar.style.visibility = "hidden";
                        }
                    }
                    if (pageBar) {
                        if (showPageBar) {
                            pageBar.style.visibility = "visible";
                        }
                        else {
                            pageBar.style.visibility = "hidden";
                        }
                    }
                    if (priceBar) {
                        if (showPriceBar) {
                            priceBar.style.visibility = "visible";
                        }
                        else {
                            priceBar.style.visibility = "hidden";
                        }
                    }
                    if (priceBarOpener) {
                        if (showPriceBar && uih_mobilePriceDisplay === "closed") {
                            priceBarOpener.classList.remove("hidden");
                        }
                        else {
                            priceBarOpener.classList.add("hidden");
                        }
                    }
                    printess.resizePrintess(true, focusSelection, undefined, printessHeight, focusSelection ? activeFFId : undefined);
                }
            }
        }
    }
    function getMobileButtons(printess, barContainer, propertyIdFilter, skipAutoSelect = false, fromImageSelection = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const container = barContainer || document.createElement("div");
        container.className = "mobile-buttons-container";
        const scrollContainer = document.createElement("div");
        scrollContainer.className = "mobile-buttons-scroll-container";
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "mobile-buttons";
        const buttons = printess.getMobileUiButtons(uih_currentProperties, propertyIdFilter || "root");
        if (uih_currentState === "document") {
            buttons.unshift(...printess.getMobileUiBackgroundButton());
        }
        const hasButtons = buttons.length > 0;
        if ((printess.spreadCount() > 1 && printess.pageNavigationDisplay() === "numbers") || (printess.pageNavigationDisplay() === "icons")) {
            renderPageNavigation(printess, getMobilePageBarDiv(), false, true);
        }
        else {
            const pagebar = document.querySelector(".mobile-pagebar");
            if (pagebar)
                pagebar.remove();
        }
        getMobilePriceBarDiv(printess);
        if (uih_currentPriceDisplay) {
            document.body.classList.add("has-mobile-price-bar");
        }
        else {
            document.body.classList.remove("has-mobile-price-bar");
        }
        let autoSelect = null;
        let autoSelectHasMeta = false;
        let firstButton = null;
        const ep = (_b = (_a = buttons[0]) === null || _a === void 0 ? void 0 : _a.newState) === null || _b === void 0 ? void 0 : _b.externalProperty;
        if (ep && buttons.length === 1 && skipAutoSelect !== true) {
            if (ep.kind === "image") {
                autoSelect = buttons[0];
            }
            if (ep.kind === "single-line-text") {
                autoSelect = buttons[0];
            }
            autoSelectHasMeta = printess.hasMetaProperties(ep);
        }
        if (!hasButtons || (autoSelect && autoSelectHasMeta === false)) {
            document.body.classList.add("no-mobile-button-bar");
        }
        else {
            document.body.classList.remove("no-mobile-button-bar");
        }
        if (hasButtons && (!autoSelect || autoSelectHasMeta === true)) {
            let controlGroup = 0;
            for (const b of buttons.filter(b => !b.hide)) {
                const selectScaleButton = b.newState.metaProperty === "image-scale" && ((_d = (_c = b.newState.externalProperty) === null || _c === void 0 ? void 0 : _c.imageMeta) === null || _d === void 0 ? void 0 : _d.canScale) && ((_e = b.newState.externalProperty) === null || _e === void 0 ? void 0 : _e.value) !== ((_g = (_f = b.newState.externalProperty) === null || _f === void 0 ? void 0 : _f.validation) === null || _g === void 0 ? void 0 : _g.defaultValue);
                const buttonDiv = document.createElement("div");
                buttonDiv.className = "no-selection";
                const properties = [];
                if (b.newState.externalProperty && b.newState.externalProperty.controlGroup > 0 && b.newState.externalProperty.controlGroup === controlGroup) {
                    continue;
                }
                else {
                    if (b.newState.externalProperty && b.newState.externalProperty.controlGroup) {
                        controlGroup = b.newState.externalProperty.controlGroup;
                        if (controlGroup > 0) {
                            buttons.forEach(p => {
                                if (p.newState.externalProperty && p.newState.externalProperty.controlGroup === controlGroup) {
                                    properties.push(p.newState.externalProperty);
                                }
                            });
                        }
                    }
                    else {
                        controlGroup = 0;
                    }
                }
                if (selectScaleButton && !autoSelect && fromImageSelection) {
                    autoSelect = b;
                    buttonDiv.classList.add("selected");
                }
                if (b.newState.tableRowIndex !== undefined) {
                    buttonDiv.id = ((_j = (_h = b.newState.externalProperty) === null || _h === void 0 ? void 0 : _h.id) !== null && _j !== void 0 ? _j : "") + "$$$" + b.newState.tableRowIndex;
                }
                else {
                    buttonDiv.id = ((_l = (_k = b.newState.externalProperty) === null || _k === void 0 ? void 0 : _k.id) !== null && _l !== void 0 ? _l : "") + ":" + ((_m = b.newState.metaProperty) !== null && _m !== void 0 ? _m : "");
                }
                if (printess.isTextButton(b) || controlGroup > 0) {
                    buttonDiv.classList.add("mobile-property-text");
                }
                else {
                    buttonDiv.classList.add("mobile-property-button");
                }
                if (!firstButton) {
                    firstButton = buttonDiv;
                }
                buttonDiv.onclick = () => {
                    mobileUiButtonClick(printess, b, buttonDiv, container, false, properties);
                };
                if (((_o = b.newState.externalProperty) === null || _o === void 0 ? void 0 : _o.kind) === "background-button") {
                    drawButtonContent(printess, buttonDiv, [b.newState.externalProperty], controlGroup);
                }
                else if (controlGroup > 0) {
                    drawButtonContent(printess, buttonDiv, properties, controlGroup);
                }
                else {
                    drawButtonContent(printess, buttonDiv, uih_currentProperties, controlGroup);
                }
                buttonContainer.appendChild(buttonDiv);
            }
        }
        if (((_p = uih_lastMobileState === null || uih_lastMobileState === void 0 ? void 0 : uih_lastMobileState.externalProperty) === null || _p === void 0 ? void 0 : _p.kind) === "selection-text-style") {
            const meta = uih_lastMobileState === null || uih_lastMobileState === void 0 ? void 0 : uih_lastMobileState.metaProperty;
            if (meta && !printess.isSoftwareKeyBoardExpanded()) {
                for (const b of buttons) {
                    if (meta === b.newState.metaProperty) {
                        autoSelect = b;
                    }
                }
            }
        }
        if (autoSelect) {
            uih_autoSelectPending = true;
            window.setTimeout(() => {
                var _a, _b, _c, _d, _e, _f;
                uih_autoSelectPending = false;
                const b = autoSelect;
                if (!b)
                    return;
                if (((_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.kind) === "background-button") {
                    printess.selectBackground();
                }
                else if (autoSelectHasMeta) {
                    let bid;
                    if (b.newState.tableRowIndex !== undefined) {
                        bid = ((_c = (_b = b.newState.externalProperty) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "") + "$$$" + b.newState.tableRowIndex;
                    }
                    else {
                        bid = ((_e = (_d = b.newState.externalProperty) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "") + ":" + ((_f = b.newState.metaProperty) !== null && _f !== void 0 ? _f : "");
                    }
                    const buttonDiv = (document.getElementById(bid));
                    if (buttonDiv) {
                        mobileUiButtonClick(printess, b, buttonDiv, container, true);
                    }
                    else {
                        console.error("Auto-Click Button not found: " + bid);
                    }
                }
                else {
                    printess.setZoomMode("spread");
                    renderMobileControlHost(printess, b.newState);
                }
            }, 50);
        }
        const scrollRight = document.createElement("div");
        scrollRight.className = "scroll-right-indicator";
        scrollContainer.appendChild(buttonContainer);
        container.appendChild(scrollContainer);
        container.appendChild(scrollRight);
        if (firstButton && (autoSelect || printess.isSoftwareKeyBoardExpanded())) {
            firstButton.style.transition = "none";
        }
        window.setTimeout(() => {
            if (firstButton) {
                const containerWidth = container.offsetWidth;
                const buttonsWidth = buttonContainer.offsetWidth + 15 - (containerWidth * 1.45);
                if (buttonsWidth > containerWidth) {
                    firstButton.style.marginLeft = "15px";
                    container.classList.add("scroll-right");
                    scrollContainer.onscroll = () => {
                        if (scrollContainer.scrollLeft > buttonContainer.offsetWidth - (container.offsetWidth * 1.45)) {
                            container.classList.remove("scroll-right");
                        }
                        else {
                            container.classList.add("scroll-right");
                        }
                    };
                }
                else {
                    const space = (containerWidth - buttonsWidth) / 2;
                    firstButton.style.marginLeft = space + "px";
                }
            }
        }, 50);
        return { div: container, autoSelectButton: autoSelect };
    }
    function mobileUiButtonClick(printess, b, buttonDiv, container, fromAutoSelect, properties) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        printess.setZoomMode("spread");
        let hadSelectedButtons = false;
        const selectImageZoomButton = fromAutoSelect && ((_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.kind) === "image" && ((_b = b.newState.externalProperty) === null || _b === void 0 ? void 0 : _b.value) !== ((_d = (_c = b.newState.externalProperty) === null || _c === void 0 ? void 0 : _c.validation) === null || _d === void 0 ? void 0 : _d.defaultValue) && ((_f = (_e = b.newState.externalProperty) === null || _e === void 0 ? void 0 : _e.imageMeta) === null || _f === void 0 ? void 0 : _f.canScale);
        if (((_g = b.newState.externalProperty) === null || _g === void 0 ? void 0 : _g.kind) === "background-button") {
            printess.selectBackground();
        }
        else if (((_h = b.newState.externalProperty) === null || _h === void 0 ? void 0 : _h.kind) === "image" && b.newState.metaProperty === "handwriting-image") {
            printess.removeHandwritingImage();
            return;
        }
        else if (b.newState.state === "table-add") {
            const p = b.newState.externalProperty;
            document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
            if (p === null || p === void 0 ? void 0 : p.tableMeta) {
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
                getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "document", fromAutoSelect));
            }
        }
        else if (b.newState.state === "table-edit") {
            const p = b.newState.externalProperty;
            const rowIndex = (_j = b.newState.tableRowIndex) !== null && _j !== void 0 ? _j : -1;
            document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
            buttonDiv.classList.toggle("selected");
            centerMobileButton(buttonDiv);
            if ((p === null || p === void 0 ? void 0 : p.tableMeta) && (rowIndex !== null && rowIndex !== void 0 ? rowIndex : -1) >= 0) {
                try {
                    const data = JSON.parse(p.value.toString());
                    tableEditRow = data[rowIndex];
                    tableEditRowIndex = rowIndex;
                    renderMobileControlHost(printess, b.newState);
                    getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "document", fromAutoSelect, willHaveControlHost(b.newState)));
                }
                catch (error) {
                    console.error("property table has no array data:" + p.id);
                }
            }
        }
        else if (b.hasCollapsedMetaProperties === true && b.newState.externalProperty) {
            uih_currentState = "details";
            const buttonContainer = document.querySelector(".mobile-buttons-container");
            if (buttonContainer) {
                buttonContainer.innerHTML = "";
                getMobileButtons(printess, container, b.newState.externalProperty.id);
                const backButton = document.querySelector(".mobile-property-back-button");
                if (backButton) {
                    (_k = backButton.parentElement) === null || _k === void 0 ? void 0 : _k.removeChild(backButton);
                }
                const mobilePlusButton = document.querySelector(".mobile-property-plus-button");
                if (mobilePlusButton) {
                    (_l = mobilePlusButton.parentElement) === null || _l === void 0 ? void 0 : _l.removeChild(mobilePlusButton);
                }
                getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "details", fromAutoSelect, willHaveControlHost(b.newState)));
                if (!fromAutoSelect) {
                    printess.setZoomMode("frame");
                }
                if (selectImageZoomButton) {
                    window.setTimeout(() => {
                        var _a, _b, _c, _d;
                        const bid = ((_b = (_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "") + ":image-scale";
                        const buttonDiv = (document.getElementById(bid));
                        if (buttonDiv) {
                            buttonDiv.classList.toggle("selected");
                            buttonDiv.innerHTML = "";
                            properties = properties && properties.length > 0 ? properties : uih_currentProperties;
                            drawButtonContent(printess, buttonDiv, properties, ((_c = b.newState.externalProperty) === null || _c === void 0 ? void 0 : _c.controlGroup) || 0);
                            if (((_d = b.newState.externalProperty) === null || _d === void 0 ? void 0 : _d.kind) === "image" && printess.canMoveSelectedFrames()) {
                                printess.setZoomMode("spread");
                            }
                            else {
                                printess.setZoomMode("frame");
                            }
                        }
                    }, 10);
                    b.newState = Object.assign(Object.assign({}, b.newState), { metaProperty: "image-scale" });
                }
            }
        }
        else {
            const sels = document.querySelectorAll(".mobile-property-button.selected");
            hadSelectedButtons = sels.length > 0;
            sels.forEach((ele) => ele.classList.remove("selected"));
            document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
            buttonDiv.classList.toggle("selected");
            buttonDiv.innerHTML = "";
            if (b.newState.externalProperty && b.newState.externalProperty.controlGroup > 0) {
                properties = properties || uih_currentProperties;
            }
            else if (b.newState.externalProperty) {
                properties = [b.newState.externalProperty];
            }
            else {
                properties = uih_currentProperties;
            }
            drawButtonContent(printess, buttonDiv, properties, ((_m = b.newState.externalProperty) === null || _m === void 0 ? void 0 : _m.controlGroup) || 0);
            centerMobileButton(buttonDiv);
            if (((_o = b.newState.externalProperty) === null || _o === void 0 ? void 0 : _o.kind) === "image" && printess.canMoveSelectedFrames()) {
                printess.setZoomMode("spread");
            }
            else {
                printess.setZoomMode("frame");
            }
            const backButton = document.querySelector(".mobile-property-back-button");
            if (backButton) {
                (_p = backButton.parentElement) === null || _p === void 0 ? void 0 : _p.removeChild(backButton);
            }
            getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, uih_currentState, fromAutoSelect, willHaveControlHost(b.newState)));
            if (((_q = b.newState.externalProperty) === null || _q === void 0 ? void 0 : _q.kind) === "selection-text-style" && !hadSelectedButtons) {
                window.setTimeout(() => {
                    renderMobileControlHost(printess, b.newState);
                }, 500);
                return;
            }
        }
        renderMobileControlHost(printess, b.newState, properties);
    }
    function willHaveControlHost(state) {
        if (state.state === "add") {
            return true;
        }
        else if (state.externalProperty) {
            return true;
        }
        return false;
    }
    function renderMobileControlHost(printess, state, properties) {
        collapseControlHost();
        const controlHost = document.getElementById("mobile-control-host");
        uih_lastMobileState = state;
        if (controlHost) {
            controlHost.style.overflow = "hidden auto";
            if (state.state === "add") {
                controlHost.classList.add("mobile-control-xl");
                const snippets = renderGroupSnippets(printess, uih_currentGroupSnippets || [], true);
                controlHost.appendChild(snippets);
            }
            else if (state.externalProperty) {
                controlHost.classList.add(getMobileControlHeightClass(printess, state.externalProperty, state.metaProperty));
                if (state.state === "table-add" || state.state === "table-edit") {
                    const control = renderTableDetails(printess, state.externalProperty, true);
                    controlHost.appendChild(control);
                }
                else {
                    if (properties && properties.length > 0 && properties[0].controlGroup > 0) {
                        controlHost.style.overflow = "auto";
                        getProperties(printess, uih_currentState, properties, controlHost);
                    }
                    else {
                        const control = getPropertyControl(printess, state.externalProperty, state.metaProperty, true);
                        controlHost.appendChild(control);
                    }
                }
                const close = getMobileNavButton({
                    name: "closeHost",
                    icon: printess.getIcon("carret-down-solid"),
                    task: () => {
                        printess.setZoomMode("spread");
                        collapseControlHost();
                        resizeMobileUi(printess);
                        const mobileBtns = document.querySelector(".mobile-buttons");
                        if (mobileBtns) {
                            mobileBtns.childNodes.forEach(b => b.classList.remove("selected"));
                        }
                    }
                }, true);
                close.classList.add("close-control-host-button");
                const mobileUi = document.querySelector(".mobile-ui");
                if (mobileUi) {
                    if (!document.body.classList.contains("no-mobile-button-bar")) {
                        mobileUi.appendChild(close);
                    }
                }
                resizeMobileUi(printess);
            }
        }
    }
    function collapseControlHost() {
        const controlHost = document.getElementById("mobile-control-host");
        const mobileUi = document.querySelector(".mobile-ui");
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
    function getMobileControlHeightClass(printess, property, meta) {
        switch (property.kind) {
            case "image":
            case "image-id":
                return "mobile-control-md";
            case "selection-text-style":
                return "mobile-control-lg";
            case "multi-line-text":
                if (!meta || meta === "text-style-color" || meta === "text-style-font" || meta === "text-style-size" || meta === "text-style-vAlign-hAlign") {
                    if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
                        return "mobile-control-xl";
                    }
                    else {
                        return "mobile-control-lg";
                    }
                }
                break;
            case "select-list":
                if (property.controlGroup > 0) {
                    return "mobile-control-sm";
                }
                else {
                    return "mobile-control-lg";
                }
            case "color":
            case "image-list":
            case "color-list":
            case "font":
                return "mobile-control-lg";
            case "text-area":
                if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
                    return "mobile-control-xl";
                }
                else {
                    return "mobile-control-lg";
                }
            case "table":
                return "mobile-control-xl";
            case "single-line-text":
                if (window.navigator.appVersion.match(/iP(ad|od|hone).*15_0/)) {
                    return "mobile-control-sm";
                }
                else {
                    return "mobile-control-sm";
                }
        }
        return "mobile-control-sm";
    }
    function drawButtonContent(printess, buttonDiv, properties, controlGroup) {
        var _a, _b;
        const id = buttonDiv.id.split(":");
        let propertyId = id[0];
        let rowIndex = undefined;
        if (propertyId.startsWith("FF") && propertyId.indexOf("$$$") > 0) {
            const tId = propertyId.split("$$$");
            propertyId = tId[0];
            rowIndex = isNaN(+tId[1]) ? undefined : +tId[1];
        }
        const metaProperty = (_a = id[1]) !== null && _a !== void 0 ? _a : "";
        const property = properties.filter(p => p.id === propertyId)[0];
        if (!property)
            return;
        const buttons = printess.getMobileUiButtons([property], propertyId);
        let b = undefined;
        if (rowIndex !== undefined) {
            for (const button of buttons) {
                if (button.newState.tableRowIndex === rowIndex) {
                    b = button;
                    break;
                }
            }
        }
        else {
            for (const button of buttons) {
                if (((_b = button.newState.metaProperty) !== null && _b !== void 0 ? _b : "") === metaProperty) {
                    b = button;
                    break;
                }
            }
        }
        if (!b)
            return;
        const isSelected = buttonDiv.classList.contains("selected");
        buttonDiv.innerHTML = "";
        if (printess.isTextButton(b) || controlGroup > 0) {
            let caption = "";
            if (controlGroup > 0) {
                for (const p of properties) {
                    caption += p.label + " ";
                }
            }
            else {
                caption = b.caption;
            }
            const buttonText = document.createElement("div");
            buttonText.className = "text";
            buttonText.innerText = caption;
            const buttonIcon = document.createElement("div");
            buttonIcon.className = "icon";
            buttonIcon.innerText = "T";
            buttonDiv.appendChild(buttonText);
            buttonDiv.appendChild(buttonIcon);
        }
        else {
            const buttonCircle = getButtonCircle(printess, b, isSelected);
            const buttonText = document.createElement("div");
            buttonText.className = "mobile-property-caption no-selection";
            buttonText.innerText = printess.gl(b.caption);
            buttonDiv.appendChild(buttonCircle);
            buttonDiv.appendChild(buttonText);
        }
    }
    function getButtonCircle(printess, m, isSelected) {
        const c = printess.getButtonCircleModel(m, isSelected);
        const circle = document.createElement("div");
        circle.className = "circle-button-graphic";
        if (c.hasSvgCircle) {
            circle.appendChild(getSvgCircle(c.displayGauge, c.gaugeValue));
        }
        if (c.hasImage) {
            const image = document.createElement("div");
            image.classList.add("circular-image");
            if (m.circleStyle)
                image.setAttribute("style", m.circleStyle);
            if (m.thumbCssUrl)
                image.style.backgroundImage = m.thumbCssUrl;
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
            circle.appendChild(icon);
        }
        return circle;
    }
    function getSvgCircle(displayGauge, gaugeValue) {
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
    function centerMobileButton(buttonDiv) {
        const eX = buttonDiv.offsetLeft;
        const scrollContainer = document.querySelector(".mobile-buttons-scroll-container");
        const mobileUi = document.querySelector(".mobile-ui");
        if (scrollContainer && mobileUi) {
            const vw = mobileUi.offsetWidth;
            scrollToLeft(scrollContainer, eX - vw / 2 + buttonDiv.offsetWidth / 2, 300);
        }
    }
    function scrollToLeft(element, to, duration, startPosition) {
        const start = startPosition !== null && startPosition !== void 0 ? startPosition : element.scrollLeft;
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
    function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1)
            return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    function getOverlay(printess, properties) {
        const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
        const isImage = properties.filter(p => p.kind === "image").length > 0;
        const isColor = properties.filter(p => p.kind === "color").length > 0;
        const hdiv = document.createElement("div");
        hdiv.style.opacity = "1";
        if (isSingleLineText) {
            const tdiv = getOverlayIcon(printess, "text", "rgba(255,100,0,1)");
            hdiv.style.border = "5px solid rgba(255,100,0,0.5)";
            hdiv.appendChild(tdiv);
        }
        else if (isImage) {
            const tdiv = getOverlayIcon(printess, "image", "rgba(0,125,255,1)");
            hdiv.style.border = "5px solid rgba(0,125,255,0.5)";
            hdiv.appendChild(tdiv);
        }
        else if (isColor) {
            const tdiv = getOverlayIcon(printess, "palette", "rgba(100,250,0,1)");
            hdiv.style.border = "5px solid rgba(100,250,0,0.5)";
            hdiv.appendChild(tdiv);
        }
        else {
            const tdiv = getOverlayIcon(printess, "cog", "rgba(200,0,100,1)");
            hdiv.style.border = "5px solid rgba(200,0,100,0.5)";
            hdiv.appendChild(tdiv);
        }
        return hdiv;
    }
    function getOverlayIcon(printess, name, color) {
        const tdiv = document.createElement("div");
        tdiv.style.position = "absolute";
        tdiv.style.top = "-16px";
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


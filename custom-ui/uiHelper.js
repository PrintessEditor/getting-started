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
        viewPortScroll: viewPortScroll,
        viewPortResize: viewPortResize,
        viewPortScrollInIFrame: viewPortScrollInIFrame,
        resize: resize
    };
    let uih_viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let uih_viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    let uih_viewportOffsetTop = 0;
    let uih_currentGroupSnippets = [];
    let uih_currentProperties = [];
    let uih_currentState = "document";
    let uih_currentRender = "never";
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
    let uih_lastOverflowState = false;
    let uih_activeImageAccordion = "Buyer Upload";
    const uih_ignoredLowResolutionErrors = [];
    console.log("Printess ui-helper loaded");
    function validateAllInputs(printess) {
        const errors = printess.validate("all");
        const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
        if (filteredErrors.length > 0) {
            printess.bringErrorIntoView(filteredErrors[0]);
            getValidationOverlay(printess, filteredErrors);
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
            getValidationOverlay(printess, filteredErrors);
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
        const errors = printess.validate("until-current-step");
        const filteredErrors = errors.filter(e => !uih_ignoredLowResolutionErrors.includes(e.boxIds[0]));
        if (filteredErrors.length > 0) {
            printess.bringErrorIntoView(filteredErrors[0]);
            getValidationOverlay(printess, filteredErrors);
            return;
        }
        printess.setStep(stepIndex);
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
    function refreshPagination(printess) {
        const spreads = printess.getAllSpreads();
        const info = printess.pageInfoSync();
        if (uih_currentRender === "mobile") {
            renderPageNavigation(printess, spreads, info, getMobilePageBarDiv(), false, true);
            renderMobileNavBar(printess);
        }
        else {
            renderPageNavigation(printess, spreads, info);
        }
    }
    function _viewPortScroll(printess, _what) {
        if (uih_viewportOffsetTop !== window.visualViewport.offsetTop || uih_viewportHeight !== window.visualViewport.height || uih_viewportWidth !== window.visualViewport.width) {
            uih_viewportOffsetTop = window.visualViewport.offsetTop;
            const keyboardExpanded = uih_viewportHeight - window.visualViewport.height > 250;
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
                            printessDiv.style.height = printess.autoScaleDetails().height + "px";
                            printessDiv.style.width = printess.autoScaleDetails().width + "px";
                            printess.resizePrintess();
                        }
                        else {
                            const height = desktopGrid.offsetHeight || window.innerHeight;
                            const calcHeight = "calc(" + height + "px - 50px - var(--editor-margin-top) - var(--editor-margin-bottom))";
                            printessDiv.style.height = calcHeight;
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
        const printessDiv = document.getElementById("desktop-printess-container");
        if (printessDiv) {
            resizeMobileUi(printess);
        }
    }
    function renderDesktopUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets) {
        var _a, _b;
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
        uih_currentGroupSnippets = groupSnippets;
        uih_currentState = state;
        uih_currentProperties = properties;
        uih_currentRender = "desktop";
        const mobileUi = document.querySelector(".mobile-ui");
        if (mobileUi) {
            mobileUi.innerHTML = "";
        }
        const printessDiv = document.getElementById("desktop-printess-container");
        const container = document.getElementById("desktop-properties");
        if (!container || !printessDiv) {
            throw new Error("#desktop-properties or #desktop-printess-container not found, please add to html.");
        }
        if (printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "big page bar") {
            container.classList.add("tabs");
        }
        else {
            container.classList.remove("tabs");
        }
        printessDiv.style.position = "relative";
        printessDiv.style.top = "";
        printessDiv.style.left = "";
        printessDiv.style.bottom = "";
        printessDiv.style.right = "";
        container.innerHTML = "";
        const t = [];
        const nav = getMobileNavbarDiv();
        if (nav)
            (_a = nav.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(nav);
        const spreads = printess.getAllSpreads();
        const info = printess.pageInfoSync();
        renderPageNavigation(printess, spreads, info);
        if (printess.stepHeaderDisplay() !== "tabs list" && printess.stepHeaderDisplay() !== "big page bar") {
            if (printess.hasSteps()) {
                container.appendChild(getDesktopStepsUi(printess));
            }
            else {
                container.appendChild(getDesktopTitle(printess));
            }
        }
        if (printess.hasSelection()) {
            sessionStorage.setItem("editableFrames", "hint closed");
            const framePulse = document.getElementById("frame-pulse");
            if (framePulse)
                (_b = framePulse.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(framePulse);
        }
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton) {
            layoutsButton.textContent = printess.gl("ui.changeLayout");
        }
        renderUiButtonHints(printess, document.body, state, false);
        renderEditableFramesHint(printess);
        if (state === "document" && printess.hasLayoutSnippets() && !sessionStorage.getItem("changeLayout")) {
            toggleChangeLayoutButtonHints();
        }
        if (state === "document") {
            const propsDiv = document.createElement("div");
            for (const p of properties) {
                t.push(JSON.stringify(p, undefined, 2));
                propsDiv.appendChild(getPropertyControl(printess, p));
            }
            if (printess.hasBackground()) {
                propsDiv.appendChild(getChangeBackgroundButton(printess));
            }
            if (printess.showImageTab()) {
                const tabsPanel = [];
                if (properties.length > 0 || printess.hasBackground()) {
                    const tabLabel = printess.formFieldTabCaption();
                    tabsPanel.push({ id: "props-list", title: tabLabel, content: propsDiv });
                }
                tabsPanel.push({ id: "my-images", title: printess.gl("ui.imagesTab"), content: renderMyImagesTab(printess, false) });
                if (groupSnippets.length > 0) {
                    tabsPanel.push({ id: "group-snippets", title: printess.gl("ui.snippetsTab"), content: renderGroupSnippets(printess, groupSnippets, false) });
                }
                container.appendChild(getTabPanel(tabsPanel, ""));
            }
            else {
                container.appendChild(propsDiv);
                container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
            }
            if (printess.hasSteps()) {
                container.appendChild(getDoneButton(printess));
            }
            properties.forEach(p => validate(printess, p));
        }
        else {
            let colorsContainer = null;
            for (const p of properties) {
                if (p.kind === "color") {
                    if (!colorsContainer) {
                        colorsContainer = document.createElement("div");
                        colorsContainer.className = "color-drop-down-list";
                        container.appendChild(colorsContainer);
                    }
                    colorsContainer.appendChild(getPropertyControl(printess, p));
                }
                else {
                    colorsContainer = null;
                    container.appendChild(getPropertyControl(printess, p));
                    validate(printess, p);
                }
                t.push(JSON.stringify(p, undefined, 2));
            }
            if (properties.length === 0) {
                container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
            }
            const hr = document.createElement("hr");
            container.appendChild(hr);
            container.appendChild(getDoneButton(printess));
        }
        return t;
    }
    function getPropertyControl(printess, p, metaProperty, forMobile = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        switch (p.kind) {
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
                        default:
                            return getMultiLineTextBox(printess, p, forMobile);
                    }
                }
                else if (p.kind === "selection-text-style") {
                    return getTextStyleControl(printess, p);
                }
                else {
                    return getMultiLineTextBox(printess, p, forMobile);
                }
            case "color":
                return getColorDropDown(printess, p, undefined, forMobile);
            case "number":
                return getNumberSlider(printess, p);
            case "image-id":
                if (forMobile) {
                    if (metaProperty) {
                        switch (metaProperty) {
                            case "image-rotation":
                                return getImageRotateControl(printess, p);
                            case "image-crop":
                                showModal(printess, "CROPMODAL", getImageCropControl(printess, p, true), printess.gl("ui.cropTab"));
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
                        tabs.push({ id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p) });
                        tabs.push({ id: "crop-" + p.id, title: printess.gl("ui.cropTab"), content: getImageCropControl(printess, p, false) });
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
                                return document.createElement("div");
                            case "image-scale":
                                {
                                    const s = getImageScaleControl(printess, p, true);
                                    if (!s)
                                        return document.createElement("div");
                                    return s;
                                }
                            case "image-rotation":
                                return getImageRotateControl(printess, p);
                            case "image-filter":
                                {
                                    const tags = (_d = p.imageMeta) === null || _d === void 0 ? void 0 : _d.filterTags;
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
                if ((_e = p.imageMeta) === null || _e === void 0 ? void 0 : _e.canUpload) {
                    tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) });
                }
                else {
                    tabs.push({ id: "upload-" + p.id, title: printess.gl("ui.imageTabSelect"), content: getImageUploadControl(printess, p) });
                }
                if (((_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.canUpload) && p.value !== ((_g = p.validation) === null || _g === void 0 ? void 0 : _g.defaultValue)) {
                    if (((_h = p.imageMeta) === null || _h === void 0 ? void 0 : _h.allows.length) > 2) {
                        tabs.push({ id: "filter-" + p.id, title: printess.gl("ui.filterTab"), content: getImageFilterControl(printess, p) });
                    }
                    tabs.push({ id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p) });
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
                        getValidationOverlay(printess, filteredErrors);
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
        else {
            container.appendChild(getDesktopNavButton(buttons.done));
        }
        return container;
    }
    function getTextStyleControl(printess, p) {
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
        const group2 = document.createElement("div");
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
        textPropertiesDiv.appendChild(group2);
        return textPropertiesDiv;
    }
    function getMultiLineTextBox(printess, p, forMobile) {
        const ta = getTextArea(printess, p, forMobile);
        if (forMobile) {
            return ta;
        }
        else {
            const container = document.createElement("div");
            container.appendChild(getTextStyleControl(printess, p));
            container.appendChild(ta);
            return container;
        }
    }
    function getSingleLineTextBox(printess, p, forMobile) {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = p.value.toString();
        inp.autocomplete = "off";
        inp.autocapitalize = "off";
        inp.spellcheck = false;
        inp.oninput = () => {
            printess.setProperty(p.id, inp.value).then(() => setPropertyVisibilities(printess));
            p.value = inp.value;
            validate(printess, p);
            const mobileButtonDiv = document.getElementById(p.id + ":");
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p]);
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
        const r = addLabel(printess, inp, p.id, forMobile, p.kind, p.label);
        return r;
    }
    function getDesktopTitle(printess) {
        const container = document.createElement("div");
        const hr = document.createElement("hr");
        container.appendChild(hr);
        const inner = document.createElement("div");
        inner.className = "desktop-title-bar mb-2";
        const h2 = document.createElement("h2");
        h2.innerText = printess.gl(printess.getTemplateTitle());
        inner.appendChild(h2);
        if (printess.hasPreviewBackButton()) {
            const btn = document.createElement("button");
            btn.className = "btn btn-outline-primary me-1";
            const svg = printess.getIcon("arrow-left");
            svg.style.width = "18px";
            svg.style.verticalAlign = "sub";
            btn.appendChild(svg);
            btn.onclick = () => printess.gotoPreviousPreviewDocument();
            inner.appendChild(btn);
        }
        else {
            inner.appendChild(document.createElement("div"));
        }
        const basketBtnBehaviour = printess.getBasketButtonBehaviour();
        const basketBtn = document.createElement("button");
        if (basketBtnBehaviour === "go-to-preview") {
            basketBtn.className = "btn btn-outline-primary";
            basketBtn.innerText = printess.gl("ui.buttonPreview");
            basketBtn.onclick = () => {
                if (validateAllInputs(printess) === true) {
                    printess.gotoNextPreviewDocument();
                }
            };
            inner.appendChild(basketBtn);
        }
        else {
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
        }
        container.appendChild(inner);
        container.appendChild(hr);
        return container;
    }
    function getValidationOverlay(printess, errors) {
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
        ignore.className = "btn btn-secondary";
        ignore.textContent = printess.gl("ui.buttonIgnore");
        ignore.onclick = () => {
            modal.style.display = "none";
            uih_ignoredLowResolutionErrors.push(error.boxIds[0]);
            const el = document.getElementById("validation-modal");
            el === null || el === void 0 ? void 0 : el.remove();
            errors.shift();
            if (printess.isCurrentStepActive()) {
                gotoNextStep(printess);
            }
            else {
                if (errors.length > 0) {
                    getValidationOverlay(printess, errors);
                    return;
                }
                printess.clearSelection();
            }
        };
        const ok = document.createElement("button");
        ok.className = "btn btn-primary";
        ok.textContent = printess.gl("ui.buttonOk");
        ok.onclick = () => {
            modal.style.display = "none";
            const el = document.getElementById("validation-modal");
            el === null || el === void 0 ? void 0 : el.remove();
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
        error.errorCode === "imageResolutionLow" && footer.appendChild(ignore);
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
        container.appendChild(hr);
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
        container.appendChild(hr);
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
                tab.onclick = () => {
                    setTabScrollPosition(div, tab, _forMobile);
                    gotoStep(printess, i);
                    if (isDesktopTabs) {
                        const activeTab = document.querySelectorAll("li.nav-item.active");
                        activeTab.forEach(e => e.classList.remove("active"));
                        const activeLink = document.querySelectorAll("a.nav-link.active");
                        activeLink.forEach(e => e.classList.remove("active"));
                        tab.classList.add("active");
                        tabLink.classList.add("active");
                    }
                    else {
                        const activeTab = document.querySelectorAll(".active-step-tab");
                        activeTab.forEach(e => e.classList.remove("active-step-tab"));
                        const activeLink = document.querySelectorAll(".active-step-tablink");
                        activeLink.forEach(e => e.classList.remove("active-step-tablink"));
                        tab.classList.add("active-step-tab");
                        tabLink.classList.add("active-step-tablink");
                    }
                };
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
                drawButtonContent(printess, mobileButtonDiv, [p]);
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
    function addLabel(printess, input, id, forMobile, kind, label) {
        input.classList.add("form-control");
        const container = document.createElement("div");
        !forMobile && container.classList.add("mb-3");
        container.id = "cnt_" + id;
        container.style.display = printess.isPropertyVisible(id) ? "block" : "none";
        if (label) {
            const htmlLabel = document.createElement("label");
            htmlLabel.className = "form-label";
            htmlLabel.setAttribute("for", "inp_" + id.replace("#", "-HASH-"));
            htmlLabel.innerText = printess.gl(label) || "";
            htmlLabel.style.display = forMobile ? "none" : "inline-block";
            if (kind === "image" && !forMobile) {
                const button = document.createElement("button");
                button.className = "btn btn-primary image-upload-btn";
                button.id = "upload-btn-" + id;
                htmlLabel.classList.add("image-upload-label");
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
        return container;
    }
    function validate(printess, p) {
        if (p.validation) {
            const container = document.getElementById("cnt_" + p.id);
            const input = document.getElementById("inp_" + p.id.replace("#", "-HASH-"));
            const validation = document.getElementById("val_" + p.id);
            if (container && input && validation) {
                if (p.validation.maxChars) {
                    if (p.value.toString().length > p.validation.maxChars) {
                        input.classList.add("is-invalid");
                        validation.innerText = printess.gl("errors.maxCharsExceededInline", p.validation.maxChars);
                        return;
                    }
                }
                if (p.validation.isMandatory && (!p.value || p.value === p.validation.defaultValue)) {
                    input.classList.add("is-invalid");
                    validation.innerText = printess.gl("errors.enterText");
                    return;
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
                thumb.className = "image" + cssId;
                if (p.kind === "color-list") {
                    thumb.style.backgroundColor = entry.key;
                }
                else {
                    thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
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
                        drawButtonContent(printess, mobileButtonDiv, [p]);
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
    function getColorDropDown(printess, p, metaProperty, forMobile = false, dropdown) {
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.classList.add("btn-group");
        }
        const colors = printess.getColors(p.id);
        const button = document.createElement("button");
        if (!forMobile) {
            button.className = "btn btn-light dropdown-toggle btn-color-select";
            button.dataset.bsToggle = "dropdown";
            button.dataset.bsAutoClose = "true";
            button.setAttribute("aria-expanded", "false");
            if (metaProperty === "color" && p.textStyle) {
                button.style.backgroundColor = p.textStyle.color;
            }
            else {
                button.style.backgroundColor = p.value.toString();
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
        for (const f of colors) {
            const color = document.createElement("a");
            color.href = "#";
            color.className = "color-picker-color dropdown-item";
            color.style.backgroundColor = f.color;
            color.dataset.color = f.name;
            color.title = f.name;
            color.onclick = () => __awaiter(this, void 0, void 0, function* () {
                setColor(printess, p, f.color, f.name, metaProperty);
                if (!forMobile)
                    button.style.backgroundColor = f.color;
            });
            colorList.appendChild(color);
        }
        if (printess.enableCustomColors()) {
            colorList.appendChild(getCustomColorPicker(printess, p, forMobile, button, metaProperty));
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
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
            else {
                yield printess.setProperty(p.id, name).then(() => setPropertyVisibilities(printess));
                p.value = color;
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
        });
    }
    function getCustomColorPicker(printess, p, forMobile, button, metaProperty) {
        const hexGroup = document.createElement("div");
        hexGroup.className = "input-group input-group-sm mt-3 mb-2";
        hexGroup.style.width = "90%";
        const hexPicker = document.createElement("span");
        hexPicker.className = "input-group-text";
        hexPicker.style.cursor = "pointer";
        const hexIcon = printess.getIcon("eye-dropper-light");
        hexIcon.style.height = "20px";
        const hexInput = document.createElement("input");
        hexInput.className = "form-control";
        hexInput.id = "hex-color-input";
        hexInput.type = "text";
        hexInput.placeholder = "#000000";
        const submitHex = document.createElement("button");
        submitHex.className = "btn btn-secondary";
        const checkHex = printess.getIcon("check");
        checkHex.style.height = "20px";
        submitHex.onclick = () => __awaiter(this, void 0, void 0, function* () {
            const colorInput = document.getElementById("hex-color-input");
            const color = colorInput === null || colorInput === void 0 ? void 0 : colorInput.value;
            setColor(printess, p, color, color, metaProperty);
            if (!forMobile)
                button.style.backgroundColor = color;
        });
        hexPicker.onclick = () => __awaiter(this, void 0, void 0, function* () {
            const colorInput = document.getElementById("hex-color-input");
            try {
                const eyeDropper = new EyeDropper();
                const { sRGBHex: color } = yield eyeDropper.open();
                if (color) {
                    colorInput.value = color;
                    setColor(printess, p, color, color, metaProperty);
                    if (!forMobile)
                        button.style.backgroundColor = color;
                }
            }
            catch (error) {
                alert("Sorry, eye-dropper tool is only available in Chrome.");
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
                a.href = "#";
                a.classList.add("dropdown-item");
                a.onclick = () => {
                    p.value = entry.key;
                    printess.setProperty(p.id, entry.key).then(() => {
                        setPropertyVisibilities(printess);
                        const mobileButtonDiv = document.getElementById(p.id + ":");
                        if (mobileButtonDiv) {
                            drawButtonContent(printess, mobileButtonDiv, [p]);
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
            return addLabel(printess, dropdown, p.id, false, p.kind, p.label);
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
    function getImageRotateControl(printess, p) {
        var _a;
        const container = document.createElement("div");
        if (p.imageMeta && p.value !== "fallback" && (p.value !== ((_a = p.validation) === null || _a === void 0 ? void 0 : _a.defaultValue))) {
            const imagePanel = document.createElement("div");
            imagePanel.className = "image-rotate-panel";
            for (let i = 1; i < 4; i++) {
                const thumbDiv = document.createElement("div");
                thumbDiv.className = "snippet-thumb";
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
        closer.style.color = "white";
        closer.style.width = "28px";
        closer.style.height = "28px";
        closer.style.cursor = "pointer";
        closer.onclick = () => {
            hideModal(id);
        };
        const modalBody = document.createElement("div");
        modalBody.className = "modal-body";
        modalBody.appendChild(content);
        modalHeader.appendChild(title);
        modalHeader.appendChild(closer);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        if (footer)
            modalContent.appendChild(footer);
        dialog.appendChild(modalContent);
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    }
    function getImageCropControl(printess, p, forMobile) {
        const container = document.createElement("div");
        if (p.value) {
            const ui = printess.createCropUi(p.id);
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
            const okBtn = document.createElement("button");
            okBtn.id = "distribute-button";
            okBtn.className = "btn btn-primary mb-3";
            okBtn.innerText = printess.gl("ui.buttonCrop");
            okBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                const spinner = document.createElement("span");
                spinner.className = "spinner-border spinner-border-sm me-3";
                const spinnerText = document.createElement("span");
                spinnerText.textContent = printess.gl("ui.cropping");
                okBtn.textContent = "";
                okBtn.appendChild(spinner);
                okBtn.appendChild(spinnerText);
                okBtn.classList.add("disabled");
                printess.cropImage(p.id, ui.getCropBox());
                if (forMobile) {
                    hideModal("CROPMODAL");
                }
            });
            container.appendChild(rangeLabel);
            container.appendChild(ui.container);
            container.appendChild(okBtn);
            container.appendChild;
        }
        return container;
    }
    function getImageUploadControl(printess, p, container, forMobile = false) {
        var _a, _b;
        container = container || document.createElement("div");
        container.innerHTML = "";
        const imagePanel = document.createElement("div");
        imagePanel.className = "image-panel";
        imagePanel.id = "image-panel" + p.id;
        const images = printess.getImages(p.id);
        const imageList = document.createElement("div");
        if (forMobile || (uih_currentProperties.length < 5 && uih_currentProperties.filter(p => p.kind === "image" || p.kind === "image-id").length <= 1)) {
            if (!forMobile) {
                if (p.imageMeta && p.imageMeta.allows.length <= 2) {
                    const filtersControl = getImageFilterControl(printess, p, undefined, false);
                    filtersControl.classList.add("mb-3");
                    container.appendChild(filtersControl);
                }
                const scaleControl = getImageScaleControl(printess, p);
                if (scaleControl) {
                    scaleControl.classList.add("mb-3");
                    container.appendChild(scaleControl);
                }
            }
            forMobile ? imagePanel.appendChild(renderImageControlButtons(printess, images, p)) : imagePanel.appendChild(renderMyImagesTab(printess, forMobile, p, images));
            imagePanel.style.gridTemplateRows = "auto";
            imagePanel.style.gridTemplateColumns = "1fr";
            container.appendChild(imagePanel);
            return container;
        }
        else {
            if ((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.canUpload) {
                container.appendChild(getImageUploadButton(printess, p.id, forMobile, true));
            }
            const imageListWrapper = document.createElement("div");
            imageListWrapper.classList.add("image-list-wrapper");
            imageList.classList.add("image-list");
            const mainThumb = document.createElement("div");
            if ((_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.thumbCssUrl) {
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
                    var _c;
                    const scaleHints = yield printess.setProperty(p.id, im.id);
                    p.value = im.id;
                    if (scaleHints && p.imageMeta) {
                        p.imageMeta.scaleHints = scaleHints;
                        p.imageMeta.scale = scaleHints.scale;
                        p.imageMeta.thumbCssUrl = im.thumbCssUrl;
                        p.imageMeta.thumbUrl = im.thumbUrl;
                        p.imageMeta.canScale = p.value !== ((_c = p.validation) === null || _c === void 0 ? void 0 : _c.defaultValue);
                    }
                    getImageUploadControl(printess, p, container, forMobile);
                    const propsDiv = document.getElementById("tabs-panel-" + p.id);
                    if (propsDiv) {
                        propsDiv.replaceWith(getPropertyControl(printess, p));
                    }
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
                const scaleControl = getImageScaleControl(printess, p);
                if (scaleControl) {
                    container.appendChild(scaleControl);
                }
                return container;
            }
        }
    }
    function getImageUploadButton(printess, id, forMobile = false, assignToFrameOrNewFrame = true) {
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
        inp.accept = "image/png,image/jpg,image/jpeg";
        inp.multiple = true;
        inp.style.display = "none";
        inp.onchange = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (inp && ((_a = inp.files) === null || _a === void 0 ? void 0 : _a.length)) {
                inp.disabled = true;
                inp.style.display = "none";
                const scaleControl = document.getElementById("range-label");
                if (scaleControl)
                    scaleControl.style.display = "none";
                const twoButtons = document.getElementById("two-buttons");
                if (twoButtons)
                    twoButtons.style.gridTemplateColumns = "1fr";
                const distributeBtn = document.getElementById("distribute-button");
                if (distributeBtn)
                    distributeBtn.style.display = "none";
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
                yield printess.uploadImages(inp.files, (progress) => {
                    progressBar.style.width = (progress * 100) + "%";
                }, assignToFrameOrNewFrame, id);
                if (printess.getImages().length > 0 && printess.getImages().filter(im => !im.inUse).length > 0 && printess.allowImageDistribution() && inp.files.length > 1) {
                    yield printess.distributeImages();
                }
                if (!assignToFrameOrNewFrame) {
                    const imageTabContainer = document.getElementById("tab-my-images");
                    imageTabContainer.innerHTML = "";
                    if (imageTabContainer)
                        imageTabContainer.appendChild(renderMyImagesTab(printess, forMobile));
                }
                uih_activeImageAccordion = "Buyer Upload";
            }
        });
        const uploadLabel = document.createElement("label");
        uploadLabel.className = "form-label";
        uploadLabel.innerText = printess.gl("ui.uploadImageLabel");
        uploadLabel.setAttribute("for", "inp_" + id.replace("#", "-HASH-"));
        container.appendChild(progressDiv);
        container.appendChild(addLabel(printess, inp, id, forMobile, "image", "ui.changeImage"));
        return container;
    }
    function getImageScaleControl(printess, p, forMobile = false) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.canScale)) {
            return null;
        }
        if (p.kind === "image-id" || !p.imageMeta) {
            return null;
        }
        const rangeLabel = document.createElement("label");
        rangeLabel.id = "range-label";
        const range = document.createElement("input");
        range.className = "form-range";
        range.type = "range";
        range.min = (_c = (_b = p.imageMeta) === null || _b === void 0 ? void 0 : _b.scaleHints.min.toString()) !== null && _c !== void 0 ? _c : "0";
        range.max = (_e = (_d = p.imageMeta) === null || _d === void 0 ? void 0 : _d.scaleHints.max.toString()) !== null && _e !== void 0 ? _e : "0";
        range.step = "0.01";
        range.value = (_g = (_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.scale.toString()) !== null && _g !== void 0 ? _g : "0";
        const span = document.createElement("span");
        if (p.imageMeta) {
            span.textContent = printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale));
        }
        rangeLabel.appendChild(span);
        rangeLabel.appendChild(range);
        if (forMobile) {
            rangeLabel.classList.add("form-control");
        }
        range.oninput = () => {
            const newScale = parseFloat(range.value);
            printess.setImageMetaProperty(p.id, "scale", newScale);
            if (p.imageMeta) {
                p.imageMeta.scale = newScale;
                span.textContent = printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale));
                const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p]);
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
        button.className = "btn-primary";
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
        range.type = "range";
        range.min = ui.meta.min.toString();
        range.max = ui.meta.max.toString();
        range.step = ui.meta.step.toString();
        range.value = ui.value.toString();
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
                drawButtonContent(printess, mobileButtonDiv, [p]);
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
        var _a, _b, _c;
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.classList.add("btn-group");
            dropdown.classList.add("form-control");
        }
        dropdown.style.padding = "0";
        const sizes = ["6pt", "7pt", "8pt", "9pt", "10pt", "11pt", "12pt", "13pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
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
                button.innerText = (_c = (_b = p.textStyle) === null || _b === void 0 ? void 0 : _b.size) !== null && _c !== void 0 ? _c : "??pt";
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
                            drawButtonContent(printess, mobileButtonDiv, [p]);
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
                            drawButtonContent(printess, mobileButtonDiv, [p]);
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
            let icon = "align-top";
            switch (v) {
                case "center":
                    icon = "align-middle";
                    break;
                case "bottom":
                    icon = "align-bottom";
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
        for (const v of ["left", "right", "center", "justifyLeft"]) {
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
                drawButtonContent(printess, mobileButtonDiv, [p]);
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
        if (typeof content === "number" && spread) {
            a.innerText = spread.name ? spread.name : content.toString();
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
    function renderPageNavigation(printess, spreads, info, container, large = false, forMobile = false) {
        const pages = container || document.querySelector("#desktop-pagebar");
        if (pages) {
            let pageNo = 0;
            pages.innerHTML = "";
            if (!forMobile) {
                const miniBar = document.createElement("div");
                const btnBack = document.createElement("button");
                const caption = printess.gl("ui.buttonBack");
                btnBack.className = "btn";
                btnBack.classList.add("btn-outline-secondary");
                btnBack.innerText = caption;
                const icon = printess.gl("ui.buttonBackIcon");
                if (icon) {
                    const svg = printess.getIcon(icon);
                    svg.style.height = "24px";
                    svg.style.float = "left";
                    svg.style.marginRight = caption ? "10px" : "0px";
                    btnBack.appendChild(svg);
                }
                if (!printess.getBackButtonCallback()) {
                    btnBack.classList.add("disabled");
                }
                btnBack.onclick = () => {
                    const callback = printess.getBackButtonCallback();
                    if (callback) {
                        handleBackButtonCallback(printess, callback);
                    }
                    else {
                        alert(printess.gl("ui.backButtonCallback"));
                    }
                };
                miniBar.appendChild(btnBack);
                if (printess.showUndoRedo()) {
                    const btnUndo = document.createElement("button");
                    btnUndo.className = "btn btn-sm undo-button";
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
                    btnRedo.className = "btn btn-sm me-2 redo-button";
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
                miniBar.className = "undo-redo-bar";
                pages.appendChild(miniBar);
            }
            const ul = document.createElement("ul");
            ul.className = "pagination";
            if (large) {
                ul.classList.add("pagination-lg");
            }
            if (printess.stepHeaderDisplay() === "big page bar" || printess.stepHeaderDisplay() === "tabs list") {
                pages.classList.add("tabs");
                ul.style.overflowX = "auto";
            }
            else {
                pages.classList.remove("tabs");
                ul.classList.add("justify-content-center");
            }
            if (printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "badge list") {
                const tabsContainer = document.createElement("div");
                tabsContainer.className = "step-tabs-list";
                tabsContainer.id = "step-tab-list";
                tabsContainer.style.marginLeft = "10px";
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
            }
            if (spreads.length > 1 && printess.showPageNavigation()) {
                if (printess.stepHeaderDisplay() !== "big page bar") {
                    const prev = getPaginationItem(printess, "previous");
                    if (info && info.isFirst) {
                        prev.classList.add("disabled");
                    }
                    ul.appendChild(prev);
                }
                const count = spreads.reduce((prev, cur) => prev + cur.pages, 0);
                const current = (info === null || info === void 0 ? void 0 : info.current) || 1;
                let lastPos = "start";
                for (const spread of spreads) {
                    for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
                        pageNo++;
                        const page = pageIndex === 0 ? "left-page" : "right-page";
                        const isActive = current === pageNo;
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
                        if (pos === "skip" && printess.stepHeaderDisplay() !== "big page bar") {
                            if (lastPos !== "skip") {
                                ul.appendChild(getPaginationItem(printess, "ellipsis"));
                            }
                        }
                        else {
                            let disable = false;
                            if (printess.lockCoverInside()) {
                                if (pageNo === 2 || pageNo === spreads.length * 2 - 3) {
                                    disable = true;
                                }
                            }
                            ul.appendChild(getPaginationItem(printess, pageNo, spread, page, isActive, true, disable));
                        }
                        lastPos = pos;
                    }
                }
                if (printess.stepHeaderDisplay() !== "big page bar") {
                    const next = getPaginationItem(printess, "next");
                    if (info && info.isLast) {
                        next.classList.add("disabled");
                    }
                    ul.appendChild(next);
                }
            }
            pages.appendChild(ul);
            if (printess.stepHeaderDisplay() === "tabs list" || printess.stepHeaderDisplay() === "big page bar") {
                const button = document.createElement("button");
                button.className = "btn btn-primary ms-2";
                const icon = printess.getIcon("shopping-cart");
                icon.style.width = "25px";
                icon.style.height = "25px";
                button.onclick = () => addToBasket(printess);
                button.appendChild(icon);
                pages.appendChild(button);
            }
        }
    }
    function renderMyImagesTab(printess, forMobile, p, images, imagesContainer, showSearchIcon = true) {
        var _a, _b;
        const container = imagesContainer || document.createElement("div");
        container.id = "image-tab-container";
        container.innerHTML = "";
        const imageList = document.createElement("div");
        imageList.classList.add("image-list");
        images = images || printess.getImages(p === null || p === void 0 ? void 0 : p.id);
        const dragDropHint = document.createElement("p");
        dragDropHint.style.marginTop = "10px";
        dragDropHint.textContent = printess.gl("ui.dragDropHint");
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
            if (!forMobile)
                container.appendChild(twoButtons);
        }
        if (printess.showSearchBar()) {
            container.appendChild(getSearchBar(printess, p, container, forMobile, showSearchIcon));
        }
        const imageGroups = printess.getImageGroups(p === null || p === void 0 ? void 0 : p.id);
        if (imageGroups.length > 1) {
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
        if (!forMobile && images.length > 0 && (p === null || p === void 0 ? void 0 : p.kind) !== "image-id")
            container.appendChild(dragDropHint);
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
                var _b;
                const scaleHints = yield printess.setProperty(p.id, im.id);
                p.value = im.id;
                if (scaleHints && p.imageMeta) {
                    p.imageMeta.scaleHints = scaleHints;
                    p.imageMeta.scale = scaleHints.scale;
                    p.imageMeta.thumbCssUrl = im.thumbCssUrl;
                    p.imageMeta.thumbUrl = im.thumbUrl;
                    p.imageMeta.canScale = p.value !== ((_b = p.validation) === null || _b === void 0 ? void 0 : _b.defaultValue);
                }
                if (forMobile) {
                    const mobileButtonsContainer = document.querySelector(".mobile-buttons-container");
                    if (mobileButtonsContainer) {
                        mobileButtonsContainer.innerHTML = "";
                        getMobileButtons(printess, mobileButtonsContainer, p.id, true);
                    }
                    const newImages = printess.getImages(p === null || p === void 0 ? void 0 : p.id);
                    renderMyImagesTab(printess, forMobile, p, newImages, container);
                    const imageListFullscreen = document.querySelector(".image-list-fullscreen.show-image-list");
                    imageListFullscreen === null || imageListFullscreen === void 0 ? void 0 : imageListFullscreen.classList.remove("show-image-list");
                    imageListFullscreen === null || imageListFullscreen === void 0 ? void 0 : imageListFullscreen.classList.add("hide-image-list");
                }
                else {
                    const propsDiv = document.getElementById("tabs-panel-" + p.id);
                    if (propsDiv) {
                        propsDiv.replaceWith(getPropertyControl(printess, p));
                    }
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
    function renderImageControlButtons(printess, images, p) {
        const container = document.createElement("div");
        container.id = "image-control-buttons";
        container.style.display = "grid";
        container.style.gridTemplateColumns = images.length > 0 ? "1fr 1fr" : "1fr";
        container.style.gridGap = "5px";
        const uploadContainer = document.createElement("div");
        uploadContainer.className = "image-list-fullscreen upload-list-preset";
        const uploadHeader = document.createElement("div");
        uploadHeader.className = "image-list-header bg-primary text-light";
        uploadHeader.textContent = printess.gl("ui.changeImage");
        const exitUpload = printess.getIcon("chevron-down-light");
        exitUpload.style.width = "20px";
        exitUpload.style.height = "30px";
        exitUpload.onclick = () => {
            uploadContainer.classList.remove("show-upload-list");
            uploadContainer.classList.add("hide-upload-list");
        };
        uploadHeader.appendChild(exitUpload);
        const uploadList = document.createElement("div");
        uploadList.id = "upload-btn-" + (p === null || p === void 0 ? void 0 : p.id);
        uploadList.style.padding = "5px";
        uploadList.appendChild(getImageUploadButton(printess, (p === null || p === void 0 ? void 0 : p.id) || "images", true));
        uploadContainer.appendChild(uploadHeader);
        uploadContainer.appendChild(uploadList);
        const upload = document.createElement("button");
        upload.className = "btn btn-outline-primary upload-image-btn";
        upload.textContent = printess.gl("ui.changeImage");
        upload.onclick = () => {
            uploadContainer.classList.remove("upload-list-preset");
            uploadContainer.classList.remove("hide-upload-list");
            uploadContainer.classList.add("show-upload-list");
        };
        const uploadIcon = printess.getIcon("cloud-upload-light");
        uploadIcon.style.height = "50px";
        upload.appendChild(uploadIcon);
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-list-fullscreen image-list-preset";
        const imageHeader = document.createElement("div");
        imageHeader.className = "image-list-header bg-primary text-light";
        imageHeader.textContent = printess.gl("ui.exchangeImage");
        const exitImages = printess.getIcon("chevron-down-light");
        exitImages.style.width = "20px";
        exitImages.style.height = "30px";
        exitImages.onclick = () => {
            imageContainer.classList.remove("show-image-list");
            imageContainer.classList.add("hide-image-list");
        };
        uploadHeader.appendChild(exitImages);
        imageHeader.appendChild(exitImages);
        const imageList = document.createElement("div");
        imageList.style.padding = "5px";
        imageList.style.height = "90%";
        imageList.style.overflowY = "auto";
        imageContainer.appendChild(imageHeader);
        imageContainer.appendChild(imageList);
        imageContainer.appendChild(renderMyImagesTab(printess, true, p, undefined, imageList));
        container.appendChild(imageContainer);
        const change = document.createElement("button");
        change.className = "btn btn-outline-primary exchange-image-btn";
        change.textContent = printess.gl("ui.exchangeImage");
        change.onclick = () => {
            imageContainer.classList.remove("image-list-preset");
            imageContainer.classList.remove("hide-image-list");
            imageContainer.classList.add("show-image-list");
        };
        const changeIcon = printess.getIcon("image");
        changeIcon.style.height = "50px";
        change.appendChild(changeIcon);
        container.appendChild(getImageUploadButton(printess, (p === null || p === void 0 ? void 0 : p.id) || "images", true, true));
        images.length > 0 ? container.appendChild(change) : "";
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
    function renderGroupSnippets(printess, groupSnippets, forMobile) {
        const div = document.createElement("div");
        div.className = "group-snippets";
        if (groupSnippets.length > 0) {
            for (const cluster of groupSnippets) {
                const headline = document.createElement("h5");
                headline.className = "snippet-cluster-name";
                headline.textContent = cluster.name;
                div.appendChild(headline);
                const hr = document.createElement("hr");
                hr.style.width = "100%";
                div.appendChild(hr);
                for (const snippet of cluster.snippets) {
                    const thumbDiv = document.createElement("div");
                    thumbDiv.className = "snippet-thumb";
                    const thumb = document.createElement("img");
                    thumb.src = snippet.thumbUrl;
                    thumb.style.backgroundColor = snippet.bgColor;
                    thumbDiv.appendChild(thumb);
                    thumbDiv.onclick = () => {
                        if (forMobile) {
                            div.innerHTML === "";
                        }
                        printess.insertGroupSnippet(snippet.snippetUrl);
                    };
                    div.appendChild(thumbDiv);
                }
            }
        }
        if (forMobile) {
            const mobile = document.createElement("div");
            mobile.className = "mobile-group-snippets-container";
            div.style.marginTop = "-20px";
            mobile.appendChild(div);
            return mobile;
        }
        else {
            return div;
        }
    }
    function renderLayoutSnippets(printess, layoutSnippets) {
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
                container.appendChild(headline);
                const clusterDiv = document.createElement("div");
                clusterDiv.className = "layout-snippet-cluster";
                for (const snippet of cluster.snippets) {
                    const thumbDiv = document.createElement("div");
                    thumbDiv.className = "snippet-thumb big";
                    const thumb = document.createElement("img");
                    thumb.src = snippet.thumbUrl;
                    thumbDiv.appendChild(thumb);
                    thumbDiv.onclick = () => {
                        printess.insertLayoutSnippet(snippet.snippetUrl);
                        const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
                        if (myOffcanvas)
                            myOffcanvas.click();
                        const offCanvas = document.getElementById("layoutOffcanvas");
                        if (offCanvas)
                            offCanvas.style.visibility = "hidden";
                    };
                    clusterDiv.appendChild(thumbDiv);
                }
                container.appendChild(clusterDiv);
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
            const data = JSON.parse(p.value.toString() || "[]");
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
                getValidationOverlay(printess, [{ boxIds: [], errorCode: "missingEventText", errorValue1: "" }]);
                return;
            }
            if (((_b = p.tableMeta) === null || _b === void 0 ? void 0 : _b.tableType) === "calendar-events" && p.tableMeta.month && p.tableMeta.year) {
                if ([4, 6, 9, 11].includes(p.tableMeta.month) && (tableEditRow.day > 30 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "30" }]);
                    return;
                }
                else if (p.tableMeta.year % 4 === 0 && p.tableMeta.month === 2 && (tableEditRow.day > 29 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "29" }]);
                    return;
                }
                else if (p.tableMeta.year % 4 > 0 && p.tableMeta.month === 2 && (tableEditRow.day > 28 || !Number(tableEditRow.day))) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "28" }]);
                    return;
                }
                else if (tableEditRow.day < 1 || tableEditRow.day > 31 || !Number(tableEditRow.day)) {
                    getValidationOverlay(printess, [{ boxIds: [], errorCode: "invalidNumber", errorValue1: "31" }]);
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
            a.href = "#";
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
                a.href = "#";
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
    function renderMobileUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets, skipAutoSelect = false) {
        var _a, _b, _c;
        uih_currentGroupSnippets = groupSnippets;
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
        const closeButton = mobileUi.querySelector(".close-control-host-button");
        if (closeButton) {
            mobileUi.removeChild(closeButton);
        }
        if (printess.spreadCount() > 1 && printess.showPageNavigation()) {
            document.body.classList.add("has-mobile-page-bar");
        }
        else {
            document.body.classList.remove("has-mobile-page-bar");
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
        if (state === "add") {
            document.body.classList.add("no-mobile-button-bar");
            renderMobileControlHost(printess, { state: "add" });
        }
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton) {
            layoutsButton.textContent = printess.gl("ui.changeLayout");
        }
        if (printess.hasSelection()) {
            sessionStorage.setItem("editableFrames", "hint closed");
            const framePulse = document.getElementById("frame-pulse");
            if (framePulse)
                (_a = framePulse.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(framePulse);
        }
        renderUiButtonHints(printess, mobileUi, state, true);
        renderEditableFramesHint(printess);
        if (state === "document" && printess.hasLayoutSnippets() && !sessionStorage.getItem("changeLayout")) {
            toggleChangeLayoutButtonHints();
        }
        if (groupSnippets.length > 0 && state !== "add") {
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
        const inTextStyle = (properties.length && properties[0].kind === "selection-text-style");
        printess.setZoomMode(inTextStyle ? "frame" : "spread");
        resizeMobileUi(printess);
    }
    function toggleChangeLayoutButtonHints() {
        const layoutsButton = document.querySelector(".show-layouts-button");
        if (layoutsButton) {
            layoutsButton.classList.add("layouts-button-pulse");
            layoutsButton.onclick = () => {
                var _a;
                const uiHintAlert = document.getElementById("ui-hint-changeLayout");
                (_a = uiHintAlert === null || uiHintAlert === void 0 ? void 0 : uiHintAlert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(uiHintAlert);
                layoutsButton.classList.remove("layouts-button-pulse");
                sessionStorage.setItem("changeLayout", "hint closed");
                layoutsButton.onclick = null;
            };
        }
    }
    function renderEditableFramesHint(printess) {
        if (printess.uiHintsDisplay().includes("editableFrames") && !sessionStorage.getItem("editableFrames")) {
            window.setTimeout(() => {
                printess.getFrames().then((frame) => {
                    var _a;
                    console.log(frame);
                    const framePulse = document.getElementById("frame-pulse");
                    if (framePulse)
                        (_a = framePulse.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(framePulse);
                    const pulseDiv = document.createElement("div");
                    pulseDiv.classList.add("frame-hint-pulse");
                    pulseDiv.id = "frame-pulse";
                    pulseDiv.style.position = "fixed";
                    pulseDiv.style.left = (frame.left + (frame.width / 2)).toFixed(0) + "px";
                    pulseDiv.style.top = (frame.top + (frame.height / 2) + uih_lastPrintessTop).toFixed(0) + "px";
                    const pointer = printess.getIcon("hand-pointer-light");
                    pointer.classList.add("frame-hint-pointer");
                    pulseDiv.appendChild(pointer);
                    document.body.appendChild(pulseDiv);
                });
            }, 2000);
        }
    }
    function renderUiButtonHints(printess, container, state = uih_currentState, forMobile) {
        var _a, _b;
        const layoutSnippetsHint = document.getElementById("ui-hint-changeLayout");
        (_a = layoutSnippetsHint === null || layoutSnippetsHint === void 0 ? void 0 : layoutSnippetsHint.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(layoutSnippetsHint);
        const groupSnippetsHint = document.getElementById("ui-hint-addDesign");
        (_b = groupSnippetsHint === null || groupSnippetsHint === void 0 ? void 0 : groupSnippetsHint.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(groupSnippetsHint);
        const uiHints = [{
                header: "addDesign",
                msg: printess.gl("ui.addDesignHint"),
                position: "absolute",
                top: "-150px",
                left: "30px",
                color: "success",
                show: printess.uiHintsDisplay().includes("groupSnippets") && state === "document" && !sessionStorage.getItem("addDesign") && uih_currentGroupSnippets.length > 0 && forMobile,
                task: () => renderMobileUi(printess, undefined, "add", undefined)
            }, {
                header: "changeLayout",
                msg: printess.gl("ui.changeLayoutHint"),
                position: "fixed",
                top: "calc(50% - 150px)",
                left: "55px",
                color: "primary",
                show: printess.uiHintsDisplay().includes("layoutSnippets") && state === "document" && !sessionStorage.getItem("changeLayout") && printess.hasLayoutSnippets(),
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
                }
            }];
        uiHints.filter(h => h.show).forEach(hint => {
            const alert = document.createElement("div");
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
                (_a = alert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(alert);
                if (hint.header === "changeLayout") {
                    const layoutsButton = document.querySelector(".show-layouts-button");
                    if (layoutsButton) {
                        layoutsButton.onclick = () => {
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
            open.textContent = "Show Me";
            open.onclick = () => {
                var _a;
                sessionStorage.setItem(hint.header, "hint closed");
                (_a = alert.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(alert);
                hint.task();
            };
            flexWrapper.appendChild(open);
            alert.appendChild(title);
            alert.appendChild(text);
            alert.appendChild(close);
            alert.appendChild(flexWrapper);
            container.appendChild(alert);
        });
    }
    function getMobilePlusButton(printess) {
        const button = document.createElement("div");
        button.className = "mobile-property-plus-button";
        const circle = document.createElement("div");
        circle.className = "mobile-property-circle";
        circle.onclick = () => {
            sessionStorage.setItem("addDesign", "hint closed");
            renderMobileUi(printess, undefined, "add", undefined);
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
                task: () => { printess.setZoomMode("spread"); renderMobileUi(printess, uih_currentProperties, "frames", undefined, true); }
            },
            document: {
                name: "document",
                icon: printess.getIcon("check"),
                task: () => renderMobileUi(printess, uih_currentProperties, "document", undefined, true)
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
                icon: printess.getIcon("shopping-cart"),
                task: () => addToBasket(printess)
            }
        };
        if (state === "add") {
            const add = getMobileNavButton(buttons.add, printess.hasSteps());
            add.classList.add("close-designs-button");
            container.appendChild(add);
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
        {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm";
            btn.classList.add("me-2");
            btn.classList.add("main-button");
            btn.style.minWidth = "40px";
            if (!printess.hasSteps() && !printess.showUndoRedo()) {
                const callback = printess.getBackButtonCallback();
                btn.className = "btn btn-sm text-white me-2 ms-2 border border-white";
                btn.textContent = printess.gl("ui.buttonBack");
                if (!callback)
                    btn.classList.add("disabled");
                btn.onclick = () => {
                    if (callback) {
                        handleBackButtonCallback(printess, callback);
                    }
                };
            }
            else {
                const ico = printess.getIcon("ellipsis-v");
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
            nav.appendChild(btn);
        }
        const basketBtnBehaviour = printess.getBasketButtonBehaviour();
        const showTitle = printess.hasSteps();
        const showUndoRedo = printess.showUndoRedo() && !printess.hasSteps() && !printess.hasPreviewBackButton();
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
        if (printess.hasPreviewBackButton()) {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm ms-2 main-button";
            const ico = printess.getIcon("arrow-left");
            ico.classList.add("icon");
            btn.appendChild(ico);
            btn.onclick = () => printess.gotoPreviousPreviewDocument();
            wrapper.appendChild(btn);
        }
        {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm ms-2 me-2 main-button";
            if (printess.hasSteps() && !printess.hasNextStep()) {
                btn.classList.add("main-button-pulse");
            }
            if (basketBtnBehaviour === "go-to-preview") {
                btn.classList.add("btn-outline-light");
                btn.innerText = printess.gl("ui.buttonPreview");
                btn.onclick = () => {
                    if (validateAllInputs(printess) === true) {
                        printess.gotoNextPreviewDocument();
                    }
                };
                wrapper.appendChild(btn);
            }
            else {
                const ico = printess.getIcon("shopping-cart");
                ico.classList.add("icon");
                btn.appendChild(ico);
                btn.onclick = () => addToBasket(printess);
                wrapper.appendChild(btn);
            }
        }
        nav.appendChild(wrapper);
        navBar.appendChild(nav);
        return navBar;
    }
    function getMobileMenuList(printess) {
        const listWrapper = document.createElement("div");
        listWrapper.id = "mobile-menu-list";
        const menuList = document.createElement("div");
        menuList.className = "btn-group w-100 d-flex flex-wrap bg-primary";
        menuList.style.position = "absolute";
        menuList.style.top = "48px";
        menuList.style.left = "0px";
        menuList.style.zIndex = "1000";
        const menuItems = [
            {
                id: "back",
                title: "ui.buttonBack",
                icon: "back",
                disabled: !printess.getBackButtonCallback(),
                show: true,
                task: function () {
                    const callback = printess.getBackButtonCallback();
                    if (callback) {
                        handleBackButtonCallback(printess, callback);
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
                title: printess.previewStepsCount() > 0 ? "ui.buttonPreview" : "Last Step",
                icon: printess.previewStepsCount() > 0 ? "preview-doc" : "angle-double-right",
                disabled: !printess.hasNextStep(),
                show: printess.hasSteps(),
                task: () => {
                    var _a, _b;
                    if (printess.previewStepsCount() > 0) {
                        printess.gotoPreviewStep();
                    }
                    else {
                        printess.gotoLastStep();
                        getCurrentTab(printess, (_b = (_a = printess.lastStep()) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0, true);
                    }
                }
            }
        ];
        menuItems.forEach((mi, idx) => {
            const item = document.createElement("li");
            item.className = "btn btn-primary d-flex w-25 justify-content-center align-items-center";
            if (mi.disabled)
                item.classList.add("disabled");
            if (mi.id === "next" || (printess.previewStepsCount() === 0 && mi.id === "lastStep"))
                item.classList.add("reverse-menu-btn-content");
            item.style.border = "1px solid rgba(0,0,0,.125)";
            if (idx < 3)
                item.style.minWidth = "33%";
            if (idx >= 3)
                item.style.minWidth = "50%";
            if (mi.id === "back" && !printess.showUndoRedo())
                item.style.minWidth = "100%";
            const span = document.createElement("span");
            span.textContent = printess.gl(mi.title);
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
            item.appendChild(span);
            item.onclick = () => {
                var _a;
                const list = document.getElementById("mobile-menu-list");
                if (list)
                    (_a = list.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(list);
                mi.task();
            };
            if (mi.show)
                menuList.appendChild(item);
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
    function resizeMobileUi(printess) {
        if (uih_autoSelectPending)
            return;
        const mobileUi = getMobileUiDiv();
        const controlHost = document.getElementById("mobile-control-host");
        if (mobileUi && controlHost) {
            const controlHostHeight = controlHost.offsetHeight;
            const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
            const mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");
            const mobileButtonBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-buttonbar-height").trim().replace("px", "") || "");
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
                const toolBar = document.querySelector(".mobile-navbar");
                const pageBar = document.querySelector(".mobile-pagebar");
                if (printessHeight < 450 || isInEddiMode || viewPortTopOffset > 0) {
                }
                else {
                    if (toolbar) {
                        printessTop += mobileNavBarHeight;
                        printessHeight -= mobileNavBarHeight;
                        showToolBar = true;
                    }
                    if (pageBar) {
                        showPageBar = true;
                        printessTop += mobilePageBarHeight;
                        printessHeight -= mobilePageBarHeight;
                    }
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
                    printess.resizePrintess(true, focusSelection, undefined, printessHeight, focusSelection ? activeFFId : undefined);
                }
            }
        }
    }
    function getMobileButtons(printess, barContainer, propertyIdFilter, skipAutoSelect = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
        if (printess.spreadCount() > 1 && printess.showPageNavigation()) {
            const spreads = printess.getAllSpreads();
            const info = printess.pageInfoSync();
            renderPageNavigation(printess, spreads, info, getMobilePageBarDiv(), false, true);
        }
        let autoSelect = null;
        let autoSelectHasMeta = false;
        let firstButton = null;
        const ep = (_b = (_a = buttons[0]) === null || _a === void 0 ? void 0 : _a.newState) === null || _b === void 0 ? void 0 : _b.externalProperty;
        if (ep && buttons.length === 1 && !skipAutoSelect) {
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
            for (const b of buttons.filter(b => !b.hide)) {
                const buttonDiv = document.createElement("div");
                if (b.newState.tableRowIndex !== undefined) {
                    buttonDiv.id = ((_d = (_c = b.newState.externalProperty) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : "") + "$$$" + b.newState.tableRowIndex;
                }
                else {
                    buttonDiv.id = ((_f = (_e = b.newState.externalProperty) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : "") + ":" + ((_g = b.newState.metaProperty) !== null && _g !== void 0 ? _g : "");
                }
                buttonDiv.className = printess.isTextButton(b) ? "mobile-property-text" : "mobile-property-button";
                if (!firstButton) {
                    firstButton = buttonDiv;
                }
                buttonDiv.onclick = () => {
                    mobileUiButtonClick(printess, b, buttonDiv, container, false);
                };
                if (((_h = b.newState.externalProperty) === null || _h === void 0 ? void 0 : _h.kind) === "background-button") {
                    drawButtonContent(printess, buttonDiv, [b.newState.externalProperty]);
                }
                else {
                    drawButtonContent(printess, buttonDiv, uih_currentProperties);
                }
                buttonContainer.appendChild(buttonDiv);
            }
        }
        if (((_j = uih_lastMobileState === null || uih_lastMobileState === void 0 ? void 0 : uih_lastMobileState.externalProperty) === null || _j === void 0 ? void 0 : _j.kind) === "selection-text-style") {
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
    function mobileUiButtonClick(printess, b, buttonDiv, container, fromAutoSelect) {
        var _a, _b, _c, _d, _e, _f, _g;
        printess.setZoomMode("spread");
        if (((_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.kind) === "background-button") {
            printess.selectBackground();
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
            const rowIndex = (_b = b.newState.tableRowIndex) !== null && _b !== void 0 ? _b : -1;
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
                    (_c = backButton.parentElement) === null || _c === void 0 ? void 0 : _c.removeChild(backButton);
                }
                const mobilePlusButton = document.querySelector(".mobile-property-plus-button");
                if (mobilePlusButton) {
                    (_d = mobilePlusButton.parentElement) === null || _d === void 0 ? void 0 : _d.removeChild(mobilePlusButton);
                }
                getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, "details", fromAutoSelect, willHaveControlHost(b.newState)));
                if (!fromAutoSelect) {
                    printess.setZoomMode("frame");
                }
            }
        }
        else {
            document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
            document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
            buttonDiv.classList.toggle("selected");
            buttonDiv.innerHTML = "";
            drawButtonContent(printess, buttonDiv, uih_currentProperties);
            centerMobileButton(buttonDiv);
            const pId = (_f = (_e = b.newState.externalProperty) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : "";
            printess.setZoomMode("frame");
            const backButton = document.querySelector(".mobile-property-back-button");
            if (backButton) {
                (_g = backButton.parentElement) === null || _g === void 0 ? void 0 : _g.removeChild(backButton);
            }
            getMobileUiDiv().appendChild(getMobilePropertyNavButtons(printess, uih_currentState, fromAutoSelect, willHaveControlHost(b.newState)));
        }
        renderMobileControlHost(printess, b.newState);
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
    function renderMobileControlHost(printess, state) {
        collapseControlHost();
        const controlHost = document.getElementById("mobile-control-host");
        uih_lastMobileState = state;
        if (controlHost) {
            if (state.state === "add") {
                controlHost.classList.add("mobile-control-xl");
                const snippets = renderGroupSnippets(printess, uih_currentGroupSnippets || [], true);
                controlHost.appendChild(snippets);
            }
            else if (state.externalProperty) {
                controlHost.classList.add(getMobileControlHeightClass(printess, state.externalProperty, state.metaProperty));
                let control;
                if (state.state === "table-add" || state.state === "table-edit") {
                    control = renderTableDetails(printess, state.externalProperty, true);
                }
                else {
                    control = getPropertyControl(printess, state.externalProperty, state.metaProperty, true);
                }
                controlHost.appendChild(control);
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
                validate(printess, state.externalProperty);
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
                break;
            case "selection-text-style":
                return "mobile-control-xxl";
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
            case "color":
            case "select-list":
            case "image-list":
            case "color-list":
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
    function drawButtonContent(printess, buttonDiv, properties) {
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
        if (printess.isTextButton(b)) {
            const buttonText = document.createElement("div");
            buttonText.className = "text";
            buttonText.innerText = b.caption;
            const buttonIcon = document.createElement("div");
            buttonIcon.className = "icon";
            buttonIcon.innerText = "T";
            buttonDiv.appendChild(buttonText);
            buttonDiv.appendChild(buttonIcon);
        }
        else {
            const buttonCircle = getButtonCircle(printess, b, isSelected);
            const buttonText = document.createElement("div");
            buttonText.className = "mobile-property-caption";
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


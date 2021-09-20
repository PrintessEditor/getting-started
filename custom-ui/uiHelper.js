var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
window.uiHelper = {
    renderLayoutSnippets: renderLayoutSnippets,
    getOverlay: getOverlay,
    renderMobileUi: renderMobileUi,
    renderMobileNavBar: renderMobileNavBar,
    renderDesktopUi: renderDesktopUi,
    refreshUndoRedoState: refreshUndoRedoState,
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
let uih_lastPrintessHeight = 0;
let uih_lastPrintessWidth = 0;
let uih_lastPrintessTop = "";
let uih_lastPrintessBottom = 0;
let uih_lastFormFieldId = undefined;
let uih_lastOverflowState = false;
console.log("Printess ui-helper loaded");
function addToBasket(printess) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = printess.validate("all");
        if (errors.length > 0) {
            printess.bringErrorIntoView(errors[0]);
            getValidationOverlay(printess, errors);
            return;
        }
        yield printess.clearSelection();
        const callback = printess.getAddToBasketCallback();
        if (callback) {
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
    if (errors.length > 0) {
        printess.bringErrorIntoView(errors[0]);
        getValidationOverlay(printess, errors);
        return;
    }
    if (printess.hasNextStep()) {
        printess.nextStep();
    }
    else {
        addToBasket(printess);
    }
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
function _viewPortScroll(printess, _what) {
    if (uih_viewportOffsetTop !== window.visualViewport.offsetTop || uih_viewportHeight !== window.visualViewport.height || uih_viewportWidth !== window.visualViewport.width) {
        uih_viewportOffsetTop = window.visualViewport.offsetTop;
        uih_viewportHeight = window.visualViewport.height;
        uih_viewportWidth = window.visualViewport.width;
        const printessDiv = document.getElementById("desktop-printess-container");
        if (printessDiv) {
            if (printess.isMobile()) {
                printessDiv.style.height = "";
                if (window.visualViewport.offsetTop > 0) {
                    resizeMobileUi(printess, true);
                }
                else {
                    resizeMobileUi(printess, false);
                }
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
        if (vpOffsetTop > 0) {
            resizeMobileUi(printess, true);
        }
        else {
            resizeMobileUi(printess, false);
        }
    }
}
function renderDesktopUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets) {
    var _a;
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
        throw "#desktop-properties or #desktop-printess-container not found, please add to html.";
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
    if (printess.hasSteps()) {
        container.appendChild(getDesktopStepsUi(printess));
    }
    else {
        container.appendChild(getDesktopTitle(printess));
    }
    if (state === "document") {
        const propsDiv = document.createElement("div");
        for (const p of properties) {
            t.push(JSON.stringify(p, undefined, 2));
            propsDiv.appendChild(getPropertyControl(printess, p));
            validate(printess, p);
        }
        if (printess.showImageTab()) {
            const tabsPanel = [];
            if (properties.length > 0) {
                const tabLabel = printess.formFieldTabCaption();
                tabsPanel.push({ id: "props-list", title: tabLabel, content: propsDiv });
            }
            tabsPanel.push({ id: "my-images", title: printess.gl("ui.imagesTab"), content: renderMyImagesTab(printess) });
            if (groupSnippets.length > 0) {
                tabsPanel.push({ id: "group-snippets", title: printess.gl("ui.snippetsTab"), content: renderGroupSnippets(printess, groupSnippets, false) });
            }
            container.appendChild(getTabPanel(tabsPanel));
        }
        else {
            container.appendChild(propsDiv);
            container.appendChild(renderGroupSnippets(printess, groupSnippets, false));
        }
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
        const hr = document.createElement("hr");
        container.appendChild(hr);
        container.appendChild(getDoneButton(printess));
    }
    return t;
}
function getPropertyControl(printess, p, metaProperty, forMobile = false) {
    switch (p.kind) {
        case "background-button":
            return getChangeBackgroundButton(printess);
        case "single-line-text":
            return getSingleLineTextBox(printess, p, forMobile);
        case "text-area":
            return getTextArea(printess, p, forMobile);
        case "multi-line-text":
            if (forMobile) {
                switch (metaProperty) {
                    case "text-style-color":
                        return getColorDropDown(printess, p, "color");
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
            else {
                return getMultiLineTextBox(printess, p, forMobile);
            }
        case "selection-text-style":
            return getTextStyleControl(printess, p);
        case "color":
            return getColorDropDown(printess, p, undefined, forMobile);
        case "number":
            return getNumberSlider(printess, p);
        case "image":
            if (forMobile) {
                if (metaProperty) {
                    switch (metaProperty) {
                        case "image-sepia":
                        case "image-brightness":
                        case "image-contrast":
                        case "image-hueRotate":
                        case "image-vivid":
                            return getNumberSlider(printess, p, metaProperty, true);
                        case "image-scale":
                            return getImageScaleControl(printess, p, true);
                    }
                    const d = document.createElement("div");
                    d.innerText = printess.gl("ui.missingControl");
                    return d;
                }
                else {
                    return getImageUploadControl(printess, p, undefined, forMobile);
                }
            }
            return getTabPanel([
                { id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) },
                { id: "filter-" + p.id, title: printess.gl("ui.filterTab"), content: getImageFilterControl(printess, p) },
                { id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p) }
            ]);
        case "select-list":
            return getDropDown(printess, p, forMobile);
        case "image-list":
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
    ok.className = "btn btn-secondary align-self-start";
    ok.innerText = printess.gl("ui.buttonChangeBackground");
    ok.onclick = () => {
        printess.selectBackground();
    };
    return ok;
}
function getDoneButton(printess) {
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    if (printess.isCurrentStepActive()) {
        if (printess.hasNextStep()) {
            ok.innerText = printess.gl("ui.buttonNext");
        }
        else {
            ok.innerText = printess.gl("ui.buttonBasket");
        }
    }
    else {
        ok.innerText = printess.gl("ui.buttonDone");
    }
    ok.style.alignSelf = "start";
    ok.style.padding = "5px";
    ok.onclick = () => {
        if (printess.isCurrentStepActive()) {
            gotoNextStep(printess);
        }
        else {
            const errors = printess.validate("selection");
            if (errors.length > 0) {
                getValidationOverlay(printess, errors);
                return;
            }
            printess.clearSelection();
        }
    };
    return ok;
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
        printess.setProperty(p.id, inp.value);
        p.value = inp.value;
        validate(printess, p);
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    };
    inp.onfocus = () => {
        if (inp.value && p.validation && p.validation.isMandatory && inp.value === p.validation.defaultValue) {
            inp.value = "";
        }
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
    const basketBtn = document.createElement("button");
    basketBtn.className = "btn btn-primary";
    basketBtn.innerText = printess.gl("ui.buttonBasket");
    basketBtn.onclick = () => addToBasket(printess);
    inner.appendChild(basketBtn);
    container.appendChild(inner);
    container.appendChild(hr);
    return container;
}
function getValidationOverlay(printess, errors) {
    const modal = document.createElement("div");
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
    title.innerHTML = printess.gl(`errors.${errors[0].errorCode}Title`).replace(/\n/g, "<br>");
    title.style.color = "#fff";
    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    const footer = document.createElement("div");
    footer.className = "modal-footer";
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = printess.gl("ui.buttonOk");
    ok.onclick = () => {
        modal.style.display = "none";
    };
    const p = document.createElement("p");
    p.className = "error-message";
    p.textContent = `${printess.gl(`errors.${errors[0].errorCode}`, errors[0].errorValue1)}`;
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
    errorList.className = "list-group list-group-flush";
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
    footer.appendChild(ok);
    content.appendChild(modalHeader);
    content.appendChild(modalBody);
    content.appendChild(footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
}
function getDesktopStepsUi(printess) {
    const container = document.createElement("div");
    const hr = document.createElement("hr");
    container.appendChild(hr);
    const flex = document.createElement("div");
    flex.className = "mb-2 d-flex align-items-center";
    if (printess.hasPreviousStep()) {
        const prevStep = document.createElement("button");
        prevStep.className = "btn";
        prevStep.style.paddingLeft = "0";
        const svg = printess.getIcon("arrow-left");
        svg.style.width = "20px";
        prevStep.appendChild(svg);
        prevStep.onclick = () => printess.previousStep();
        flex.appendChild(prevStep);
    }
    const cur = printess.getStep();
    const hd = printess.stepHeaderDisplay();
    if (cur && printess.isCurrentStepActive()) {
        if (hd === "never") {
            const h2 = document.createElement("h2");
            h2.style.flexGrow = "1";
            h2.className = "mb-0";
            h2.innerText = printess.getTemplateTitle();
            flex.appendChild(h2);
        }
        if (hd === "only badge" || hd === "title and badge") {
            const badge = document.createElement("div");
            badge.className = "step-badge";
            badge.innerText = (cur.index + 1).toString();
            flex.appendChild(badge);
        }
        if (hd === "only title" || hd === "title and badge") {
            const h2 = document.createElement("h2");
            h2.style.flexGrow = "1";
            h2.className = "mb-0";
            h2.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
            flex.appendChild(h2);
        }
    }
    else {
        flex.style.justifyContent = "space-between";
    }
    if (printess.hasNextStep()) {
        const nextStep = document.createElement("button");
        nextStep.className = "btn btn-outline-primary";
        nextStep.innerText = printess.isNextStepPreview() ? printess.gl("ui.buttonPreview") : printess.gl("ui.buttonNext");
        nextStep.onclick = () => gotoNextStep(printess);
        flex.appendChild(nextStep);
    }
    else {
        const nextStep = document.createElement("button");
        nextStep.className = "btn btn-primary";
        nextStep.innerText = printess.gl("ui.buttonBasket");
        nextStep.onclick = () => addToBasket(printess);
        flex.appendChild(nextStep);
    }
    container.appendChild(flex);
    container.appendChild(hr);
    return container;
}
function getTextArea(printess, p, forMobile) {
    const inp = document.createElement("textarea");
    inp.value = p.value.toString();
    inp.autocomplete = "off";
    inp.oninput = () => __awaiter(this, void 0, void 0, function* () {
        yield printess.setProperty(p.id, inp.value);
        p.value = inp.value;
        validate(printess, p);
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    });
    inp.rows = 6;
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
    container.classList.add("mb-3");
    container.id = "cnt_" + id;
    if (label) {
        const htmlLabel = document.createElement("label");
        htmlLabel.className = "form-label";
        htmlLabel.setAttribute("for", "inp_" + id);
        htmlLabel.innerText = (label && (printess.gl(label)) || printess.gl(label) || "");
        htmlLabel.style.display = forMobile ? "none" : "inline-block";
        if (kind === "image") {
            const button = document.createElement("button");
            button.className = "btn btn-primary image-upload-btn";
            button.id = "upload-btn-" + id;
            htmlLabel.classList.add("image-upload-label");
            button.appendChild(htmlLabel);
            container.appendChild(button);
        }
        else {
            container.appendChild(htmlLabel);
        }
    }
    input.id = "inp_" + id;
    container.appendChild(input);
    const validation = document.createElement("div");
    validation.id = "val_" + id;
    validation.classList.add("invalid-feedback");
    validation.innerText = printess.gl("errors.textMissingInline");
    container.appendChild(validation);
    return container;
}
function validate(printess, p) {
    if (p.validation) {
        const container = document.getElementById("cnt_" + p.id);
        const input = document.getElementById("inp_" + p.id);
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
                validation.innerText = p.kind === "image" ? printess.gl("errors.imageMissingInline") : printess.gl("errors.enterText");
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
            thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
            thumb.style.width = p.listMeta.thumbWidth + "px";
            thumb.style.height = p.listMeta.thumbHeight + "px";
            if (entry.key === p.value)
                thumb.classList.add("selected");
            thumb.onclick = () => {
                printess.setProperty(p.id, entry.key);
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
    for (const f of colors) {
        const color = document.createElement("a");
        color.href = "#";
        color.className = "color-picker-color dropdown-item";
        color.style.backgroundColor = f.color;
        color.dataset.color = f.name;
        color.title = f.name;
        color.onclick = () => __awaiter(this, void 0, void 0, function* () {
            if (metaProperty === "color") {
                printess.setTextStyleProperty(p.id, metaProperty, f.name);
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv && p.textStyle) {
                    p.textStyle.color = f.color;
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
            else {
                yield printess.setProperty(p.id, f.name);
                p.value = f.color;
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
            if (!forMobile)
                button.style.backgroundColor = f.color;
        });
        colorList.appendChild(color);
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
                printess.setProperty(p.id, entry.key);
                const mobileButtonDiv = document.getElementById(p.id + ":");
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
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
function getTabPanel(tabs) {
    const panel = document.createElement("div");
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
function getImageFilterControl(printess, p, filterDiv) {
    var _a;
    const container = filterDiv || document.createElement("div");
    (_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.allows.forEach(metaProperty => {
        switch (metaProperty) {
            case "brightness":
                container.appendChild(getNumberSlider(printess, p, "image-brightness"));
                break;
            case "contrast":
                container.appendChild(getNumberSlider(printess, p, "image-contrast"));
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
        }
    });
    const filterBtn = document.createElement("button");
    filterBtn.className = "btn btn-secondary mt-4 w-100";
    filterBtn.textContent = "Reset Filter";
    filterBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
        if (p.imageMeta) {
            p.imageMeta.brightness = 0;
            p.imageMeta.sepia = 0;
            p.imageMeta.hueRotate = 0;
            p.imageMeta.contrast = 0;
            p.imageMeta.vivid = 0;
            yield printess.resetImageFilters(p.id, p.imageMeta);
        }
        container.innerHTML = "";
        getImageFilterControl(printess, p, container);
    });
    container.appendChild(filterBtn);
    return container;
}
function getImageRotateControl(printess, p) {
    const container = document.createElement("div");
    if (p.imageMeta) {
        const imagePanel = document.createElement("div");
        imagePanel.className = "image-rotate-panel";
        for (let i = 1; i < 4; i++) {
            const thumbDiv = document.createElement("div");
            thumbDiv.className = "snippet-thumb";
            const thumb = document.createElement("img");
            thumb.src = p.imageMeta.thumbUrl;
            thumbDiv.appendChild(thumb);
            thumbDiv.onclick = () => {
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
    return container;
}
function getImageUploadControl(printess, p, container, forMobile = false) {
    var _a;
    container = container || document.createElement("div");
    container.appendChild(getImageUplaodButton(printess, p.id, forMobile, true));
    const imagePanel = document.createElement("div");
    imagePanel.className = "image-panel";
    imagePanel.id = "image-panel" + p.id;
    const imageListWrapper = document.createElement("div");
    imageListWrapper.classList.add("image-list-wrapper");
    const imageList = document.createElement("div");
    imageList.classList.add("image-list");
    const images = printess.getImages(p.id);
    const mainThumb = document.createElement("div");
    if ((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.thumbCssUrl) {
        mainThumb.className = "main";
        mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
        imagePanel.appendChild(mainThumb);
    }
    for (const im of images) {
        const thumb = document.createElement("div");
        thumb.style.backgroundImage = im.thumbCssUrl;
        if (im.id === p.value)
            thumb.style.border = "2px solid red";
        thumb.onclick = () => {
            printess.setProperty(p.id, im.id);
            p.value = im.id;
            validate(printess, p);
        };
        imageList.appendChild(thumb);
    }
    imageListWrapper.appendChild(imageList);
    imagePanel.appendChild(imageListWrapper);
    let scaleControl = undefined;
    if (forMobile) {
        container.classList.add("form-control");
        container.appendChild(imageList);
        return container;
    }
    else {
        container.appendChild(imagePanel);
        scaleControl = getImageScaleControl(printess, p);
        container.appendChild(scaleControl);
        return container;
    }
}
function getImageUplaodButton(printess, id, forMobile = false, assignToFrameOrNewFrame = true) {
    const container = document.createElement("div");
    const fileUpload = document.createElement("div");
    fileUpload.className = "mb-3";
    fileUpload.id = "cnt_" + id;
    const progressDiv = document.createElement("div");
    progressDiv.className = "progress";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.style.width = "0%";
    progressDiv.style.display = "none";
    progressDiv.appendChild(progressBar);
    const inp = document.createElement("input");
    inp.type = "file";
    inp.id = "inp_" + id;
    inp.className = "form-control";
    inp.accept = "image/png,image/jpg,image/jpeg";
    inp.multiple = true;
    inp.style.display = "none";
    inp.onchange = () => {
        var _a;
        if (inp && ((_a = inp.files) === null || _a === void 0 ? void 0 : _a.length)) {
            inp.disabled = true;
            inp.style.display = "none";
            const scaleControl = document.getElementById("range-label");
            if (scaleControl)
                scaleControl.style.display = "none";
            const imagePanel = document.getElementById("image-panel" + id);
            if (imagePanel)
                imagePanel.style.display = "none";
            progressDiv.style.display = "flex";
            const label = document.getElementById("upload-btn-" + id);
            if (label) {
                label.style.display = "none";
            }
            printess.uploadImages(inp.files, (progress) => {
                progressBar.style.width = (progress * 100) + "%";
            }, assignToFrameOrNewFrame, id);
            if (!assignToFrameOrNewFrame)
                renderMyImagesTab(printess);
        }
    };
    const uploadLabel = document.createElement("label");
    uploadLabel.className = "form-label";
    uploadLabel.innerText = printess.gl("ui.uploadImageLabel");
    uploadLabel.setAttribute("for", "inp_" + id);
    fileUpload.appendChild(addLabel(printess, inp, id, forMobile, "image", "ui.changeImage"));
    container.appendChild(progressDiv);
    container.appendChild(fileUpload);
    return container;
}
function getImageScaleControl(printess, p, forMobile = false) {
    var _a, _b, _c, _d, _f, _g;
    const rangeLabel = document.createElement("label");
    rangeLabel.id = "range-label";
    const range = document.createElement("input");
    range.className = "form-range";
    range.type = "range";
    range.min = (_b = (_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.scaleHints.min.toString()) !== null && _b !== void 0 ? _b : "0";
    range.max = (_d = (_c = p.imageMeta) === null || _c === void 0 ? void 0 : _c.scaleHints.max.toString()) !== null && _d !== void 0 ? _d : "0";
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
    const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
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
    var _a;
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
        dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";
    const fonts = printess.getFonts(p.id);
    const ddContent = document.createElement("ul");
    if (p.textStyle && fonts.length) {
        const selectedItem = (_a = fonts.filter(itm => { var _a, _b; return (_b = itm.name === ((_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.font)) !== null && _b !== void 0 ? _b : ""; })[0]) !== null && _a !== void 0 ? _a : null;
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
                printess.setTextStyleProperty(p.id, "font", entry.name);
                if (p.textStyle) {
                    p.textStyle.font = entry.name;
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
function getPaginationItem(printess, content, spread, page, isActive) {
    const li = document.createElement("li");
    li.className = "page-item";
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
        li.classList.add("me-2");
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
        if (!forMobile && printess.getBackButtonCallback()) {
            const miniBar = document.createElement("div");
            const btnBack = document.createElement("button");
            btnBack.className = "btn btn-sm";
            btnBack.classList.add("btn-outline-secondary");
            btnBack.innerText = printess.gl("ui.buttonBack");
            btnBack.onclick = () => {
                const callback = printess.getBackButtonCallback();
                if (forMobile && printess.hasPreviousStep()) {
                    printess.previousStep();
                    renderMobileNavBar(printess);
                }
                else if (callback) {
                    if (printess.isInDesignerMode()) {
                        callback("");
                    }
                    else {
                        printess.save().then((token) => {
                            callback(token);
                        });
                    }
                }
                else {
                    alert(printess.gl("ui.backButtonCallback"));
                }
            };
            miniBar.appendChild(btnBack);
            const btnUndo = document.createElement("button");
            btnUndo.className = "btn btn-sm undo-button";
            if (printess.undoCount() === 0) {
                btnUndo.disabled = true;
            }
            const icoUndo = printess.getIcon("undo");
            icoUndo.classList.add("icon");
            btnUndo.onclick = () => {
                printess.undo();
            };
            btnUndo.appendChild(icoUndo);
            miniBar.appendChild(btnUndo);
            const btnRedo = document.createElement("button");
            btnRedo.className = "btn btn-sm me-2 redo-button";
            const iconRedo = printess.getIcon("redo");
            iconRedo.classList.add("icon");
            if (printess.redoCount() === 0) {
                btnRedo.disabled = true;
            }
            btnRedo.onclick = () => {
                printess.redo();
            };
            btnRedo.appendChild(iconRedo);
            miniBar.appendChild(btnRedo);
            miniBar.className = "undo-redo-bar";
            pages.appendChild(miniBar);
        }
        const ul = document.createElement("ul");
        ul.className = "pagination justify-content-center";
        if (large) {
            ul.classList.add("pagination-lg");
        }
        if (spreads.length > 1) {
            const prev = getPaginationItem(printess, "previous");
            if (info && info.isFirst) {
                prev.classList.add("disabled");
            }
            ul.appendChild(prev);
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
                    if (pos === "skip") {
                        if (lastPos !== "skip") {
                            ul.appendChild(getPaginationItem(printess, "ellipsis"));
                        }
                    }
                    else {
                        ul.appendChild(getPaginationItem(printess, pageNo, spread, page, isActive));
                    }
                    lastPos = pos;
                }
            }
            const next = getPaginationItem(printess, "next");
            if (info && info.isLast) {
                next.classList.add("disabled");
            }
            ul.appendChild(next);
        }
        pages.appendChild(ul);
    }
}
function renderMyImagesTab(printess) {
    const container = document.createElement("div");
    container.innerHTML = "";
    const imageList = document.createElement("div");
    imageList.classList.add("image-list");
    const images = printess.getAllImages();
    for (const im of images) {
        const thumb = document.createElement("div");
        thumb.className = "big";
        thumb.draggable = true;
        thumb.ondragstart = (ev) => { var _a; return (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', `${im.id}`); };
        thumb.style.backgroundImage = im.thumbCssUrl;
        thumb.style.opacity = im.inUse ? "0.5" : "1.0";
        imageList.appendChild(thumb);
    }
    const distributeBtn = document.createElement("button");
    distributeBtn.className = "btn btn-primary my-3 w-100";
    distributeBtn.innerText = printess.gl("ui.buttonDistribute");
    distributeBtn.onclick = () => printess.distributeImages();
    container.appendChild(imageList);
    if (images.length > 0)
        container.appendChild(distributeBtn);
    container.appendChild(getImageUplaodButton(printess, "file-uploader", false, false));
    return container;
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
        var _a;
        if (((_a = p.tableMeta) === null || _a === void 0 ? void 0 : _a.tableType) === "calendar-events" && !tableEditRow.text) {
            alert(printess.gl("ui.eventText"));
            return;
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
function renderMobileUi(printess, properties = uih_currentProperties, state = uih_currentState, groupSnippets = uih_currentGroupSnippets) {
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
    if (state === "document") {
        if (properties.length === 0 || printess.spreadCount() < 2) {
            document.body.classList.add("inline-mobile-page-bar");
        }
        else {
            document.body.classList.remove("inline-mobile-page-bar");
        }
    }
    if (state !== "add") {
        const buttonsOrPages = getMobileButtons(printess);
        mobileUi.innerHTML = "";
        mobileUi.appendChild(buttonsOrPages);
    }
    const controlHost = document.createElement("div");
    controlHost.className = "mobile-control-host";
    controlHost.id = "mobile-control-host";
    mobileUi.appendChild(controlHost);
    if (state === "add") {
        document.body.classList.add("no-mobile-button-bar");
        renderMobileControlHost(printess, { state: "add" });
    }
    if (groupSnippets.length > 0 && state !== "add") {
        mobileUi.appendChild(getMobilePlusButton(printess));
    }
    if (state !== "document") {
        mobileUi.appendChild(getMobileBackButton(printess, state));
    }
    else {
        if (uih_viewportOffsetTop) {
            return;
        }
    }
    resizeMobileUi(printess, false);
}
function getMobilePlusButton(printess) {
    const button = document.createElement("div");
    button.className = "mobile-property-plus-button";
    const circle = document.createElement("div");
    circle.className = "mobile-property-circle";
    circle.onclick = () => {
        renderMobileUi(printess, undefined, "add", undefined);
    };
    const icon = printess.getIcon("plus");
    circle.appendChild(icon);
    button.appendChild(circle);
    return button;
}
function getMobileBackButton(printess, state) {
    const button = document.createElement("div");
    button.className = "mobile-property-back-button";
    const circle = document.createElement("div");
    circle.className = "mobile-property-circle";
    if (state === "details") {
        circle.classList.add("back-to-frames");
    }
    circle.onclick = () => {
        if (state === "details") {
            renderMobileUi(printess, undefined, "frames");
        }
        else if (state === "frames") {
            printess.clearSelection();
        }
        else if (state === "add" || state === "document") {
            renderMobileUi(printess, undefined, "document");
        }
    };
    const icon = printess.getIcon("arrow-left");
    circle.appendChild(icon);
    button.appendChild(circle);
    return button;
}
function renderMobileNavBar(printess) {
    const navBar = getMobileNavbarDiv();
    navBar.innerHTML = "";
    let nav = document.createElement("div");
    nav.className = "navbar navbar-dark";
    nav.style.flexWrap = "nowrap";
    if (printess.getBackButtonCallback()) {
        const btn = document.createElement("button");
        btn.className = "btn btn-sm";
        btn.classList.add("ms-2");
        btn.classList.add("me-2");
        btn.classList.add("main-button");
        if (printess.hasPreviousStep()) {
            const ico = printess.getIcon("arrow-left");
            ico.classList.add("icon");
            btn.appendChild(ico);
        }
        else {
            btn.classList.add("btn-outline-light");
            btn.innerText = printess.gl("ui.buttonBack");
        }
        btn.onclick = () => {
            const callback = printess.getBackButtonCallback();
            if (printess.hasPreviousStep()) {
                printess.previousStep();
                renderMobileNavBar(printess);
            }
            else if (callback) {
                if (printess.isInDesignerMode()) {
                    callback("");
                }
                else {
                    printess.save().then((token) => {
                        callback(token);
                    });
                }
            }
            else {
                const offcanvas = document.getElementById("templateOffcanvas");
                if (offcanvas) {
                    const bsOffcanvas = new bootstrap.Offcanvas(offcanvas);
                    bsOffcanvas.show();
                }
                else {
                    alert(printess.gl("backButtonCallback"));
                }
            }
        };
        nav.appendChild(btn);
    }
    const undoredo = document.createElement("div");
    undoredo.style.display = "flex";
    {
        const btn = document.createElement("button");
        btn.className = "btn btn-sm";
        const ico = printess.getIcon("undo");
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
        const ico = printess.getIcon("redo");
        ico.classList.add("icon");
        btn.onclick = () => {
            printess.redo();
        };
        btn.appendChild(ico);
        undoredo.appendChild(btn);
    }
    nav.appendChild(undoredo);
    {
        const btn = document.createElement("button");
        btn.className = "btn btn-sm";
        btn.classList.add("ms-2");
        btn.classList.add("me-2");
        btn.classList.add("btn-outline-light");
        btn.classList.add("main-button");
        if (printess.hasNextStep()) {
            btn.innerText = printess.isNextStepPreview() ? printess.gl("ui.buttonPreview") : printess.gl("ui.buttonNext");
            const curStep = printess.getStep();
            const lastStep = printess.lastStep();
            if (curStep && lastStep) {
                btn.title = "Step " + curStep.index + " of " + lastStep.index;
            }
            btn.onclick = () => {
                gotoNextStep(printess);
                renderMobileNavBar(printess);
            };
            nav.appendChild(btn);
        }
        else if (printess.getAddToBasketCallback()) {
            btn.innerText = printess.gl("ui.buttonBasket");
            btn.onclick = () => addToBasket(printess);
            nav.appendChild(btn);
        }
    }
    navBar.appendChild(nav);
    const s = printess.getStep();
    const hd = printess.stepHeaderDisplay();
    if (s && printess.isCurrentStepActive() && hd !== "never") {
        nav = document.createElement("div");
        nav.className = "mobile-step-bar";
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
            step.appendChild(h6);
        }
        nav.appendChild(step);
        navBar.appendChild(nav);
    }
    else {
        document.body.classList.remove("mobile-has-steps-header");
    }
    return navBar;
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
function resizeMobileUi(printess, focusSelection = false) {
    const mobileUi = getMobileUiDiv();
    const controlHost = document.getElementById("mobile-control-host");
    if (mobileUi && controlHost) {
        const controlHostHeight = controlHost.offsetHeight;
        const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
        const mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");
        const mobileButtonBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-buttonbar-height").trim().replace("px", "") || "");
        mobileUi.style.height = (mobileButtonBarHeight + controlHostHeight + 2) + "px";
        const printessDiv = document.getElementById("desktop-printess-container");
        const viewPortHeight = uih_viewportHeight ? uih_viewportHeight : window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const viewPortWidth = uih_viewportWidth ? uih_viewportWidth : window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewPortTopOffset = uih_viewportOffsetTop;
        let printessHeight = viewPortHeight - controlHostHeight - mobileButtonBarHeight;
        if (printessDiv) {
            let printessTop;
            if (viewPortTopOffset > 0) {
                printessTop = viewPortTopOffset + "px";
            }
            else if (controlHostHeight > 100 || viewPortTopOffset > 0) {
                printessTop = "0";
                window.setTimeout(() => {
                    const toolBar = document.querySelector(".mobile-navbar");
                    if (toolBar)
                        toolBar.style.visibility = "hidden";
                    const pageBar = document.querySelector(".mobile-pagebar");
                    if (pageBar)
                        pageBar.style.visibility = "hidden";
                }, 400);
            }
            else {
                let top = 0;
                printessTop = "";
                printessHeight -= mobilePageBarHeight;
                printessHeight -= mobileNavBarHeight;
                const toolBar = document.querySelector(".mobile-navbar");
                if (toolBar) {
                    toolBar.style.visibility = "visible";
                    top += mobileNavBarHeight;
                }
                const pageBar = document.querySelector(".mobile-pagebar");
                if (pageBar) {
                    pageBar.style.visibility = "visible";
                    top += mobilePageBarHeight;
                }
                printessTop = top + "px";
            }
            const printessBottom = mobileButtonBarHeight + controlHostHeight;
            const activeFFId = getActiveFormFieldId();
            if ((focusSelection && activeFFId !== uih_lastFormFieldId) || printessBottom !== uih_lastPrintessBottom || printessTop !== uih_lastPrintessTop || printessHeight !== uih_lastPrintessHeight || viewPortWidth !== uih_lastPrintessWidth) {
                uih_lastPrintessBottom = printessBottom;
                uih_lastPrintessTop = printessTop;
                uih_lastPrintessHeight = printessHeight;
                uih_lastPrintessWidth = viewPortWidth;
                uih_lastFormFieldId = activeFFId;
                printessDiv.style.position = "fixed";
                printessDiv.style.left = "0";
                printessDiv.style.right = "0";
                printessDiv.style.bottom = (mobileButtonBarHeight + controlHostHeight) + "px";
                printessDiv.style.top = printessTop;
                printessDiv.style.width = "";
                printessDiv.style.height = "";
                printess.resizePrintess(true, focusSelection, undefined, printessHeight, focusSelection ? activeFFId : undefined);
            }
        }
    }
}
function getMobileButtons(printess, container, propertyIdFilter) {
    var _a, _b, _c, _d, _f;
    container = container || document.createElement("div");
    container.className = "mobile-buttons-container";
    const scrollContainer = document.createElement("div");
    scrollContainer.className = "mobile-buttons-scroll-container";
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "mobile-buttons";
    const buttons = printess.getMobileUiButtons(uih_currentProperties, propertyIdFilter || "root");
    const hasButtons = buttons.length > 0;
    if (printess.spreadCount() > 1) {
        const spreads = printess.getAllSpreads();
        const info = printess.pageInfoSync();
        if (hasButtons && !document.body.classList.contains('inline-mobile-page-bar')) {
            renderPageNavigation(printess, spreads, info, getMobilePageBarDiv(), false, true);
        }
        else if (!hasButtons) {
            document.body.classList.remove("no-mobile-button-bar");
            buttonContainer.style.width = "100%";
            renderPageNavigation(printess, spreads, info, buttonContainer, true, true);
        }
    }
    let autoSelect = false;
    if (buttons.length === 1) {
        const ep = buttons[0].newState.externalProperty;
        if (ep && ep.id.startsWith("FF_")) {
            if (ep.kind === 'single-line-text') {
                autoSelect = true;
            }
        }
        else {
            autoSelect = false;
        }
    }
    if (autoSelect) {
        document.body.classList.add("no-mobile-button-bar");
        window.setTimeout(() => {
            var _a;
            const b = buttons[0];
            if (((_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.kind) === "background-button") {
                printess.selectBackground();
            }
            else {
                renderMobileControlHost(printess, b.newState);
            }
        }, 50);
    }
    else if (hasButtons) {
        document.body.classList.remove("no-mobile-button-bar");
        for (const b of buttons) {
            const buttonDiv = document.createElement("div");
            if (b.newState.tableRowIndex !== undefined) {
                buttonDiv.id = ((_b = (_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "") + "$$$" + b.newState.tableRowIndex;
            }
            else {
                buttonDiv.id = ((_d = (_c = b.newState.externalProperty) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : "") + ":" + ((_f = b.newState.metaProperty) !== null && _f !== void 0 ? _f : "");
            }
            buttonDiv.className = printess.isTextButton(b) ? "mobile-property-text" : "mobile-property-button";
            buttonDiv.onclick = (_e) => {
                var _a, _b, _c, _d;
                if (((_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.kind) === "background-button") {
                    printess.selectBackground();
                }
                else if (b.newState.state === "table-add") {
                    const p = b.newState.externalProperty;
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
                        getMobileUiDiv().appendChild(getMobileBackButton(printess, "document"));
                    }
                }
                else if (b.newState.state === "table-edit") {
                    const p = b.newState.externalProperty;
                    const rowIndex = (_b = b.newState.tableRowIndex) !== null && _b !== void 0 ? _b : -1;
                    if ((p === null || p === void 0 ? void 0 : p.tableMeta) && (rowIndex !== null && rowIndex !== void 0 ? rowIndex : -1) >= 0) {
                        try {
                            const data = JSON.parse(p.value.toString());
                            tableEditRow = data[rowIndex];
                            tableEditRowIndex = rowIndex;
                            renderMobileControlHost(printess, b.newState);
                            getMobileUiDiv().appendChild(getMobileBackButton(printess, "document"));
                        }
                        catch (error) {
                            console.error("property table has no array data:" + p.id);
                        }
                    }
                }
                else if (b.hasCollapsedMetaProperties === true && b.newState.externalProperty) {
                    const buttonContainer = document.querySelector(".mobile-buttons-container");
                    if (buttonContainer) {
                        buttonContainer.innerHTML = "";
                        getMobileButtons(printess, container, b.newState.externalProperty.id);
                        const backButton = document.querySelector(".mobile-property-back-button");
                        if (backButton) {
                            (_c = backButton.parentElement) === null || _c === void 0 ? void 0 : _c.removeChild(backButton);
                        }
                        getMobileUiDiv().appendChild(getMobileBackButton(printess, "details"));
                    }
                }
                else {
                    document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
                    document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
                    buttonDiv.classList.toggle("selected");
                    buttonDiv.innerHTML = "";
                    drawButtonContent(printess, buttonDiv, uih_currentProperties);
                    centerMobileButton(buttonDiv);
                    const backButton = document.querySelector(".mobile-property-back-button");
                    if (backButton) {
                        (_d = backButton.parentElement) === null || _d === void 0 ? void 0 : _d.removeChild(backButton);
                    }
                    if (printess.isCurrentStepActive()) {
                        getMobileUiDiv().appendChild(getMobileBackButton(printess, "details"));
                    }
                    else {
                        getMobileUiDiv().appendChild(getMobileBackButton(printess, uih_currentState));
                    }
                }
                renderMobileControlHost(printess, b.newState);
            };
            drawButtonContent(printess, buttonDiv, uih_currentProperties);
            buttonContainer.appendChild(buttonDiv);
        }
    }
    scrollContainer.appendChild(buttonContainer);
    container.appendChild(scrollContainer);
    return container;
}
function renderMobileControlHost(printess, state) {
    const controlHost = document.getElementById("mobile-control-host");
    if (controlHost) {
        controlHost.classList.remove("mobile-control-sm");
        controlHost.classList.remove("mobile-control-md");
        controlHost.classList.remove("mobile-control-lg");
        controlHost.classList.remove("mobile-control-xl");
        controlHost.innerHTML = "";
        if (state.state === "add") {
            controlHost.classList.add("mobile-control-xl");
            const snippets = renderGroupSnippets(printess, uih_currentGroupSnippets || [], true);
            controlHost.appendChild(snippets);
        }
        else if (state.externalProperty) {
            controlHost.classList.add(getMobileControlHeightClass(state.externalProperty, state.metaProperty));
            let control;
            if (state.state === "table-add" || state.state === "table-edit") {
                control = renderTableDetails(printess, state.externalProperty, true);
            }
            else {
                control = getPropertyControl(printess, state.externalProperty, state.metaProperty, true);
            }
            controlHost.appendChild(control);
            resizeMobileUi(printess, true);
            validate(printess, state.externalProperty);
        }
    }
}
function getMobileControlHeightClass(property, meta) {
    switch (property.kind) {
        case "image":
            if (!meta) {
                return "mobile-control-lg";
            }
            break;
        case "multi-line-text":
            if (!meta || meta === "text-style-color" || meta === "text-style-font" || meta === "text-style-size") {
                return "mobile-control-lg";
            }
            break;
        case "color":
        case "text-area":
        case "select-list":
        case "image-list":
            return "mobile-control-lg";
        case "table":
            return "mobile-control-xl";
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
function scrollToLeft(element, to, duration) {
    const start = element.scrollLeft;
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


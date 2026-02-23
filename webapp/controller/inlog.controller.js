sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "com/lh/sapui5/zcrtinlogoutlog/model/formatter",
    "sap/m/MessageBox",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    "sap/m/Dialog",
    'sap/m/Button',
    'sap/m/Bar',
    'sap/ui/core/IconPool',
    "sap/m/Title",
    "sap/m/MessageToast",
    'sap/ui/core/Fragment'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, FilterOperator, Filter, formatter, MessageBox, MessageItem, MessageView, Dialog, Button, Bar, IconPool, Title, MessageToast, Fragment) {
        "use strict";
        var oRouter, oController, oMeterInlogModel, oResourceBundle, aMessages = [], UIComponent, sEquipmentNo = "", oReceivedBy = "";
        return Controller.extend("com.lh.sapui5.zcrtinlogoutlog.controller.inlog", {
            formatter: formatter,
            onInit: function () {
                oController = this;
                UIComponent = oController.getOwnerComponent();
                oRouter = UIComponent.getRouter();
                oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
                oMeterInlogModel = oController.getOwnerComponent().getModel("ZDM_METER_INLOG_SRV");
                var oDeviceModel = oController.getOwnerComponent().getModel("device");
                // bIsDesktop = oDeviceModel.getProperty("/system/desktop");
                var user = sap.ushell.Container.getUser();
                oReceivedBy = user.getId();
                oController._EventDelegate();
                oRouter.attachRouteMatched(oController.initController, oController)
            },
            initController: function () {
                debugger;
                oController._fnResetInlog();
                oController._fninitailLoad();
            },
            _fnResetInlog: function () {
                var oInlogData = new JSONModel({
                    InlogItemPath: "com.lh.sapui5.zcrtinlogoutlog.fragment.inlogItem",
                    oCurrentDate: oController.formatter.fnDateFormate(new Date()),
                    MeterNo: "",
                    bIsReadAndDeliveryDisable: false,
                    InitialLoad: {
                        MRValidityCode: "U",
                        Umlgo: "",
                        NavDisposition: [],
                        NavMRValidity: [],
                        sExistingMeter: '',
                        MeterResults: {
                            DelvKwhFlag: "",//false,
                            DelvKwFlag: "",//false,
                            DelvKvaFlag: "",//false,
                            DelvKvarFlag: "",//false,
                            DelvKvahFlag: "",//false,
                            DelvKvarhFlag: "",//false,
                            RecvKwhFlag: "",//false,
                            RecvKwFlag: "",//false,
                            RecvKvaFlag: "",//false,
                            RecvKvarFlag: "",//false,
                            RecvKvahFlag: "",//false,
                            RecvKvarhFlag: "",//false,
                        }
                    },
                    ItemDataSet: []
                });
                oController.getView().setModel(oInlogData, "InLogModel");
            },
            _EventDelegate: function () {
                debugger;
                var oElement = oController.getView().byId("idInlogSerialNumber");
                var oDelegate = {
                    onfocusout: function (oEvent) {
                        var sValue = oElement.getValue();
                        oController._fngetMeterDetails(sValue);
                    },
                };
                oElement.addEventDelegate(oDelegate);
            },
            _fngetMeterDetails: function (sEquip) {
                debugger;
                if (sEquipmentNo === sEquip) {
                    return;
                };
                var aFilter = [], oModel = oController.getView().getModel("InLogModel");
                aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, sEquip));
                oMeterInlogModel.read("/MeterHeaderSet", {
                    filters: aFilter,
                    urlParameters: { '$expand': 'NavSOHistory' },
                    success: function (oData, oResponse) {

                        if (oData.results.length) {
                            var oResults = oData.results[0];
                            sEquipmentNo = sEquip;
                            oModel.setProperty("/InitialLoad/MeterResults", oResults);
                            var sExistingMeter = oModel.getProperty("/InitialLoad/sExistingMeter")
                            if (!oResults.OrderNumber && sExistingMeter !== oResults.SerialNumber) {
                                MessageBox.warning(oResourceBundle.getText("lhInlogNoServiceOrderMsg", [oResults.SerialNumber]));
                            }
                            oModel.setProperty("/InitialLoad/sExistingMeter", oResults.SerialNumber);
                        }
                    }, error: function (oError) {
                        var oMessage;
                        sEquipmentNo = sEquip
                        if (oError.responseText.startsWith("<")) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                            oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                        } else {
                            var oResponseText = oError.responseText;
                            var sParsedResponse = JSON.parse(oResponseText);
                            oMessage = sParsedResponse.error.message.value
                        }
                        MessageBox.error(oMessage);
                    }
                });
            },
            onSubmitMeter: function (oEvent) {
                var sValue = oEvent.getParameter('value');
                oController._fngetMeterDetails(sValue);


            },
            onPressSoActHistory: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.lh.sapui5.zcrtinlogoutlog.fragment.soActivity",
                        controller: this
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },
            _fnCreateMessageStru: function (oData) {
                var sMsgType;
                switch (oData.Type) {
                    case 'S':
                        sMsgType = "Success"
                        break;
                    case 'W':
                        sMsgType = "Warning"
                        break;
                    case 'E':
                        sMsgType = "Error"
                        break;
                }
                aMessages.push({
                    type: sMsgType,
                    title: "Meter: " + oData.SerialNumber,
                    description: oData.Message,
                    subtitle: oData.Message,
                    counter: 1
                });
            },
            _fnMessageManager: function (oMessages) {
                var oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    description: '{description}',
                    subtitle: '{subtitle}',
                    counter: '{counter}',
                    markupDescription: '{markupDescription}',
                });
                var oModel = new JSONModel();
                oModel.setData(oMessages);
                this.oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/",
                        template: oMessageTemplate
                    }
                });

                var oBackButton = new Button({
                    icon: IconPool.getIconURI("nav-back"),
                    visible: false,
                    press: function () {
                        oController.oMessageView.navigateBack();
                        this.setVisible(false);
                    }
                });
                this.oMessageView.setModel(oModel);
                this.oDialog = new Dialog({
                    resizable: true,
                    content: this.oMessageView,
                    state: 'Error',
                    beginButton: new Button({
                        press: function () {
                            aMessages = [];
                            this.getParent().close();
                        },
                        text: "Close"
                    }),
                    customHeader: new Bar({
                        contentLeft: [oBackButton],
                        contentMiddle: [
                            new Title({
                                text: "Message",
                                level: sap.ui.core.TitleLevel.H4
                            })
                        ]
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%",
                    verticalScrolling: false
                });
                this.oDialog.open();
            },
            onSelectionchangeDisposition: function (oEvent) {
                var sSelKey = oEvent.getParameter("selectedItem").getKey();
                var oInLogModel = oController.getView().getModel("InLogModel");
                var oDispositionInput = oController.getView().byId("idInlogDisposition");

                var aResults = oInLogModel.getProperty("/InitialLoad/NavDisposition/results");
                var oSelectedKey = aResults.filter(function (oValue) {
                    return oValue.DispositionCode === sSelKey
                });
                oInLogModel.setProperty("/InitialLoad/SelectedDisposition", oSelectedKey[0]);
                oDispositionInput.setValueState("None");
                oDispositionInput.setValueStateText("");

            },
            onChangeMRVal: function (oEvent) {
                var oInLogModel = oController.getView().getModel("InLogModel");
                var oSelectedItem = oEvent.getParameter('selectedItem'), sItemKey;
                var oMRValidityInput = oController.getView().byId("idMRValidity");
                oMRValidityInput.setValueState("None");
                oMRValidityInput.setValueStateText("");
                sItemKey = oSelectedItem.getKey();
                oInLogModel.setProperty("/InitialLoad/bIsReadAndDeliveryDisable", false);
                if (Number(sItemKey)) {
                    oInLogModel.setProperty("/InitialLoad/bIsReadAndDeliveryDisable", true);
                }
            },
            onLiveChangeMeter: function (oEvnt) {
                var oMeterInput = oController.getView().byId("idInlogSerialNumber");
                oMeterInput.setValueState("None");
                oMeterInput.setValueStateText("");
            },
            onSearch: function () {
                debugger;
                var oMrValSelect = oController.getView().byId("idMRValidity");
                var oModel = oController.getView().getModel("InLogModel");
                var aSelectedDisposition = oModel.getProperty("/InitialLoad/SelectedDisposition");
                var oMeterResults = oModel.getProperty("/InitialLoad/MeterResults");
                var sMRValidityText = oMrValSelect.getSelectedItem().getText();
                var aItemDataSet = oModel.getProperty("/ItemDataSet");
                var sMeterNumber = oModel.getProperty("/MeterNo");
                var IsValidted = oController._fnValidateHeader(oModel);
                var bNoDuplicateRecord = IsValidted ? oController._fnCheckDuplicateRecord(sMeterNumber) : false;;
                if (IsValidted && bNoDuplicateRecord) {
                    var oItemData = {
                        SerialNumber: oMeterResults.SerialNumber,
                        CodeGroupActivities: "",
                        ActivityCode: "",
                        ActivityCodeDesc: "",
                        Disposition: aSelectedDisposition.DispositionText,
                        ValidationStatus: "",
                        PostingDate: oModel.getProperty("/oCurrentDate"),
                        DelvReadKwh: oModel.getProperty("/InitialLoad/DelvReadKwh"),
                        DelvReadKw: oModel.getProperty("/InitialLoad/DelvReadKw"),
                        DelvReadKva: oModel.getProperty("/InitialLoad/DelvReadKva"),
                        DelvReadKvar: oModel.getProperty("/InitialLoad/DelvReadKvar"),
                        DelvReadKvah: oModel.getProperty("/InitialLoad/DelvReadKvah"),
                        DelvReadKvarh: oModel.getProperty("/InitialLoad/DelvReadKvarh"),
                        MeterReadValidity: sMRValidityText,
                        MeterStatus: oMeterResults.MeterStatus,
                        RecvReadKwh: oModel.getProperty("/InitialLoad/RecvReadKwh"),
                        RecvReadKw: oModel.getProperty("/InitialLoad/RecvReadKw"),
                        RecvReadKva: oModel.getProperty("/InitialLoad/RecvReadKva"),
                        RecvReadKvar: oModel.getProperty("/InitialLoad/RecvReadKvar"),
                        RecvReadKvah: oModel.getProperty("/InitialLoad/RecvReadKvah"),
                        RecvReadKvarh: oModel.getProperty("/InitialLoad/RecvReadKvarh"),
                        DestinationStorageLocation: aSelectedDisposition.DestStorageLocText,
                        TransferStorageLocation: "",
                        OrderNumber: oModel.getProperty("/InitialLoad/MeterResults/OrderNumber"),
                        OperationNo: "",
                        Message: "",
                        Type: "",
                    }
                    oController._fnValidateLineItems();
                    aItemDataSet.push(oItemData);
                    oModel.setProperty("/ItemDataSet", aItemDataSet);
                    MessageToast.show(oResourceBundle.getText("lhInlogLineItemAddedMsg"));
                }
            },
            _fnCheckDuplicateRecord: function (sMeterNumber) {
                var bHasDuplicate, oModel = oController.getView().getModel("InLogModel"),
                    aLineItems = oModel.getProperty("/ItemDataSet");
                var bHasDuplicate = aLineItems.some(function (value, index, arr) {
                    return Number(value.SerialNumber) === Number(sMeterNumber)
                });
                bHasDuplicate ? MessageToast.show(oResourceBundle.getText("lhInlogDuplicateMeterMsg")) : null; //
                return !bHasDuplicate;
            },
            _fnValidateHeader: function (oModel) {
                debugger;
                var aSelectedDisposition = oModel.getProperty("/InitialLoad/SelectedDisposition");
                var sMeter = oModel.getProperty("/MeterNo");
                var oNavMRValidity = oModel.getProperty("/InitialLoad/MRValidityCode");
                var oMeterInput = oController.getView().byId("idInlogSerialNumber");
                var oDispositionInput = oController.getView().byId("idInlogDisposition");
                var oMRValidityInput = oController.getView().byId("idMRValidity");
                //*************** Added By Dinesh  */
                let DelvKvaFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKvaFlag");
                let DelvKvahFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKvahFlag");
                let DelvKvarFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKvarFlag");
                let DelvKvarhFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKvarhFlag");
                let DelvKwFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKwFlag");
                let DelvKwhFlag = oModel.getProperty("/InitialLoad/MeterResults/DelvKwhFlag");
                let RecvKvaFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKvaFlag");
                let RecvKvahFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKvahFlag");
                let RecvKvarFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKvarFlag");
                let RecvKvarhFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKvarhFlag");
                let RecvKwFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKwFlag");
                let RecvKwhFlag = oModel.getProperty("/InitialLoad/MeterResults/RecvKwhFlag");

                let DelvReadKvaInput = oController.getView().byId("idInlogDelvReadKva");
                let DelvReadKwhInput = oController.getView().byId("idInlogDelvReadKwh");
                let DelvReadKwInput = oController.getView().byId("idInlogDelvReadKw");
                let DelvReadKvarInput = oController.getView().byId("idInlogDelvReadKvar");
                let DelvReadKvahInput = oController.getView().byId("idInlogDelvReadKvah");
                let DelvReadKvarhInput = oController.getView().byId("idInlogDelvReadKvarh");

                let RecvReadKwhInput = oController.getView().byId("idInlogRecvReadKwh");
                let RecvReadKwInput = oController.getView().byId("idInlogRecvReadKw");
                let RecvReadKvaInput = oController.getView().byId("idInlogRecvReadKva");
                let RecvReadKvarInput = oController.getView().byId("idInlogRecvReadKvar");
                let RecvReadKvahInput = oController.getView().byId("idInlogRecvReadKvah");
                let RecvReadKvarhInput = oController.getView().byId("idInlogRecvReadKvarh");

                //*********************************/
                var bIsValidated = true;
                if (!sMeter) {
                    oMeterInput.setValueState("Error");
                    oMeterInput.setValueStateText(oResourceBundle.getText("lhInlogEnterMeterMsg")); //
                    bIsValidated = false;
                }
                if (!aSelectedDisposition) {
                    oDispositionInput.setValueState("Error");
                    oDispositionInput.setValueStateText(oResourceBundle.getText("lhInlogDispositionMsg")); //
                    bIsValidated = false;
                }
                if (!oNavMRValidity) {
                    oMRValidityInput.setValueState("Error");
                    oMRValidityInput.setValueStateText(oResourceBundle.getText("lhInlogMrValMsg")); // 
                    bIsValidated = false;
                }
                //*********************** Added By Dinesh ***********/
                if (DelvKvaFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKva") === undefined || oModel.getProperty("/InitialLoad/DelvReadKva") === '')) {
                    DelvReadKvaInput.setValueState("Error");
                    DelvReadKvaInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelkVAErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKvaInput.setValueState("None");
                    DelvReadKvaInput.setValueStateText("");
                }
                if (DelvKvahFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKvah") === undefined || oModel.getProperty("/InitialLoad/DelvReadKvah") === '')) {
                    DelvReadKvahInput.setValueState("Error");
                    DelvReadKvahInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelkVAhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKvahInput.setValueState("None");
                    DelvReadKvahInput.setValueStateText("");
                }
                if (DelvKvarFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKvar") === undefined || oModel.getProperty("/InitialLoad/DelvReadKvar") === '')) {
                    DelvReadKvarInput.setValueState("Error");
                    DelvReadKvarInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelKvarErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKvarInput.setValueState("None");
                    DelvReadKvarInput.setValueStateText("");
                }
                if (DelvKvarhFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKvarh") === undefined || oModel.getProperty("/InitialLoad/DelvReadKvarh") === '')) {
                    DelvReadKvarhInput.setValueState("Error");
                    DelvReadKvarhInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelkvarhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKvarhInput.setValueState("None");
                    DelvReadKvarhInput.setValueStateText("");
                }
                if (DelvKwFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKw") === undefined || oModel.getProperty("/InitialLoad/DelvReadKw") === '')) {
                    DelvReadKwInput.setValueState("Error");
                    DelvReadKwInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelkwErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKwInput.setValueState("None");
                    DelvReadKwInput.setValueStateText("");
                }
                if (DelvKwhFlag !== '' && (oModel.getProperty("/InitialLoad/DelvReadKwh") === undefined || oModel.getProperty("/InitialLoad/DelvReadKwh") === '')) {
                    DelvReadKwhInput.setValueState("Error");
                    DelvReadKwhInput.setValueStateText(oResourceBundle.getText("lhInlogReadDelkwhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    DelvReadKwhInput.setValueState("None");
                    DelvReadKwhInput.setValueStateText("");
                }
                if (RecvKvaFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKva") === undefined || oModel.getProperty("/InitialLoad/RecvReadKva") === '')) {
                    RecvReadKvaInput.setValueState("Error");
                    RecvReadKvaInput.setValueStateText(oResourceBundle.getText("lhInlogReadReckVAErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKvaInput.setValueState("None");
                    RecvReadKvaInput.setValueStateText("");
                }
                if (RecvKvahFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKvah") === undefined || oModel.getProperty("/InitialLoad/RecvReadKvah") === '')) {
                    RecvReadKvahInput.setValueState("Error");
                    RecvReadKvahInput.setValueStateText(oResourceBundle.getText("lhInlogReadReckVAhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKvahInput.setValueState("None");
                    RecvReadKvahInput.setValueStateText("");
                }
                if (RecvKvarFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKvar") === undefined || oModel.getProperty("/InitialLoad/RecvReadKvar") === '')) {
                    RecvReadKvarInput.setValueState("Error");
                    RecvReadKvarInput.setValueStateText(oResourceBundle.getText("lhInlogReadRecKvarErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKvarInput.setValueState("None");
                    RecvReadKvarInput.setValueStateText("");
                }
                if (RecvKvarhFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKvarh") === undefined || oModel.getProperty("/InitialLoad/RecvReadKvarh") === '')) {
                    RecvReadKvarhInput.setValueState("Error");
                    RecvReadKvarhInput.setValueStateText(oResourceBundle.getText("lhInlogReadReckvarhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKvarhInput.setValueState("None");
                    RecvReadKvarhInput.setValueStateText("");
                }
                if (RecvKwFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKw") === undefined || oModel.getProperty("/InitialLoad/RecvReadKw") === '')) {
                    RecvReadKwInput.setValueState("Error");
                    RecvReadKwInput.setValueStateText(oResourceBundle.getText("lhInlogReadReckWErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKwInput.setValueState("None");
                    RecvReadKwInput.setValueStateText("");
                }
                if (RecvKwhFlag !== '' && (oModel.getProperty("/InitialLoad/RecvReadKwh") === undefined || oModel.getProperty("/InitialLoad/RecvReadKwh") === '')) {
                    RecvReadKwhInput.setValueState("Error");
                    RecvReadKwhInput.setValueStateText(oResourceBundle.getText("lhInlogReadReckwhErrMsg")); // 
                    bIsValidated = false;
                } else {
                    RecvReadKwhInput.setValueState("None");
                    RecvReadKwhInput.setValueStateText("");
                }
                //******************************************************/

                return bIsValidated;
            },
            _fnValidateLineItems: function () {
                // User this for line item validtion
            },
            _fninitailLoad: function () {
                debugger;
                oMeterInlogModel.read("/MIInitialLoadSet", {
                    urlParameters: { '$expand': 'NavMRValidity,NavDisposition' },
                    success: function (oData, oResponse) {
                        var aDispostiton = oData.results[0].NavDisposition;
                        var aNavMRValidity = oData.results[0].NavMRValidity;
                        oController.getView().getModel("InLogModel").setProperty("/ReceivedBy", oReceivedBy);
                        oController.getView().getModel("InLogModel").setProperty("/InitialLoad/NavDisposition", aDispostiton);
                        oController.getView().getModel("InLogModel").setProperty("/InitialLoad/NavMRValidity", aNavMRValidity);
                    }, error: function (oError) {
                        var oMessage;
                        if (oError.responseText.startsWith("<")) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                            oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

                        } else {
                            var oResponseText = oError.responseText;
                            var sParsedResponse = JSON.parse(oResponseText);
                            oMessage = sParsedResponse.error.message.value
                        }
                        MessageBox.error(oMessage);
                    }
                });
            },
            onHandleDelete: function () {
                var oModel = oController.getView().getModel("InLogModel");
                var aLineItems = oModel.getProperty("/ItemDataSet");
                var oTable = oController.getView().byId("idInlogItemDataSetTable");
                var aSelectedIndices = oTable.getSelectedIndices()
                aLineItems = aLineItems.filter((value, index) => !aSelectedIndices.includes(index));
                oModel.setProperty("/ItemDataSet", aLineItems);
            },
            onPressPostButton: function () {
                var oTable = oController.getView().byId("idInlogItemDataSetTable");
                var aSelecedIndices = oTable.getSelectedIndices();
                if (aSelecedIndices.length) {
                    oController._CreateEntries(aSelecedIndices);
                } else {
                    var oMsg = oResourceBundle.getText("lineItemSelInfoMsg");
                    MessageToast.show(oMsg);
                }
            },
            _fnGetSelectedItems: function () {
                var oTable = oController.getView().byId("idInlogItemDataSetTable");
                var oModel = oController.getView().getModel("InLogModel");
                var aSelecedIndices = oTable.getSelectedIndices();
            },
            _CreateEntries: function (aSelecedIndices) {
                var oProps = {};
                var oTable = oController.getView().byId("idInlogItemDataSetTable");
                var oModel = oController.getView().getModel("InLogModel");
                var aSelecedIndices = oTable.getSelectedIndices();
                var iRecords = aSelecedIndices.length;
                var oTableData = oModel.getProperty("/ItemDataSet");
                var oMrValSelect = oController.getView().byId("idMRValidity");
                var sMRValidityKey = oMrValSelect.getSelectedItem().getKey();
                var sMsg = "";
                aSelecedIndices.map(function (currentValue, index, arr) {
                    var oSelectedList = oTableData[currentValue];
                    oProps.properties = {
                        "SerialNumber": oSelectedList.SerialNumber,
                        "CodeGroupActivities": "",
                        "ActivityCode": "",
                        "ActivityCodeDesc": "",
                        "Disposition": oSelectedList.Disposition,
                        "ValidationStatus": "",
                        "PostingDate": oSelectedList.PostingDate + "T00:00:00",//"\/Date(1713225600000)\/",
                        "DelvReadKwh": oSelectedList.DelvReadKwh ? oSelectedList.DelvReadKwh : '0',
                        "DelvReadKw": oSelectedList.DelvReadKw ? oSelectedList.DelvReadKw : '0',
                        "DelvReadKva": oSelectedList.DelvReadKva ? oSelectedList.DelvReadKva : '0',
                        "DelvReadKvar": oSelectedList.DelvReadKvar ? oSelectedList.DelvReadKvar : '0',
                        "DelvReadKvah": oSelectedList.DelvReadKvah ? oSelectedList.DelvReadKvah : '0',
                        "DelvReadKvarh": oSelectedList.DelvReadKvarh ? oSelectedList.DelvReadKvarh : '0',
                        "MeterReadValidity": sMRValidityKey,
                        "MeterStatus": oSelectedList.MeterStatus,
                        "RecvReadKwh": oSelectedList.RecvReadKwh ? oSelectedList.RecvReadKwh : '0',
                        "RecvReadKw": oSelectedList.RecvReadKw ? oSelectedList.RecvReadKw : '0',
                        "RecvReadKva": oSelectedList.RecvReadKva ? oSelectedList.RecvReadKva : '0',
                        "RecvReadKvar": oSelectedList.RecvReadKvar ? oSelectedList.RecvReadKvar : '0',
                        "RecvReadKvah": oSelectedList.RecvReadKvah ? oSelectedList.RecvReadKvah : '0',
                        "RecvReadKvarh": oSelectedList.RecvReadKvarh ? oSelectedList.RecvReadKvarh : '0',
                        "DestinationStorageLocation": oModel.getProperty("/InitialLoad/SelectedDisposition/DestStorageLoc"),
                        "TransferStorageLocation": "0",
                        "OrderNumber": oSelectedList.OrderNumber,
                        "OperationNo": "",
                        "Message": "",
                        "Type": ""
                    }

                    oProps.success = function (oData, oResponse) {
                        oController._fnMapResponseResults(oData);
                        if (oMeterInlogModel.hasPendingChanges()) {
                            oMeterInlogModel.resetChanges();
                        }
                        oController._fnCreateMessageStru(oData);
                        if (iRecords === (index + 1)) {
                            oController._fnMessageManager(aMessages);
                        }
                    },
                        oProps.error = function (oError) {
                            var oMessage;
                            aMessages = [];
                            if (iRecords === (index + 1)) {
                                // Need to add logic 
                            }
                            if (oError.responseText.startsWith("<")) {
                                var parser = new DOMParser();
                                var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                                oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

                            } else {
                                var oResponseText = oError.responseText;
                                var sParsedResponse = JSON.parse(oResponseText);
                                oMessage = sParsedResponse.error.message.value
                            }
                            MessageBox.error(oMessage);

                            if (oMeterInlogModel.hasPendingChanges()) {
                                oMeterInlogModel.resetChanges();
                            }
                        },
                        oProps.refreshAfterChange = true;
                    var oEntry = oMeterInlogModel.createEntry("/MeterItemSet", oProps);
                });
                var mParameter = {};
                oMeterInlogModel.submitChanges("BatchGroupID", mParameter);
            },
            _fnMapResponseResults: function (odata) {
                var oTable = oController.getView().byId("idInlogItemDataSetTable");
                var oModel = oController.getView().getModel("InLogModel");
                var oTableData = oModel.getProperty("/ItemDataSet");
                oTableData.map(function (currentValue, index, arr) {
                    if (currentValue.SerialNumber === odata.SerialNumber) {
                        var oProps = {
                            "SerialNumber": odata.SerialNumber,
                            "CodeGroupActivities": "",
                            "ActivityCode": "",
                            "ActivityCodeDesc": "",
                            "Disposition": "",
                            "ValidationStatus": "",
                            "PostingDate": oController.formatter.fnDateFormate(odata.PostingDate), //"\/Date(1713225600000)\/",
                            "DelvReadKwh": odata.DelvReadKwh ? odata.DelvReadKwh : '0',
                            "DelvReadKw": odata.DelvReadKw ? odata.DelvReadKw : '0',
                            "DelvReadKva": odata.DelvReadKva ? odata.DelvReadKva : '0',
                            "DelvReadKvar": odata.DelvReadKvar ? odata.DelvReadKvar : '0',
                            "DelvReadKvah": odata.DelvReadKvah ? odata.DelvReadKvah : '0',
                            "DelvReadKvarh": odata.DelvReadKvarh ? odata.DelvReadKvarh : '0',
                            "MeterReadValidity": odata.MeterReadValidity,
                            "MeterStatus": odata.MeterStatus,
                            "RecvReadKwh": odata.RecvReadKwh ? odata.RecvReadKwh : '0',
                            "RecvReadKw": odata.RecvReadKw ? odata.RecvReadKw : '0',
                            "RecvReadKva": odata.RecvReadKva ? odata.RecvReadKva : '0',
                            "RecvReadKvar": odata.RecvReadKvar ? odata.RecvReadKvar : '0',
                            "RecvReadKvah": odata.RecvReadKvah ? odata.RecvReadKvah : '0',
                            "RecvReadKvarh": odata.RecvReadKvarh ? odata.RecvReadKvarh : '0',
                            "DestinationStorageLocation": "0",
                            "TransferStorageLocation": "0",
                            "OrderNumber": "",
                            "OperationNo": "",
                            "Message": odata.Message,
                            "Type": odata.Type
                        }
                        oModel.setProperty("/ItemDataSet/" + index, oProps);
                        oModel.refresh();
                    }
                });
            },
            onPressCancelButton: function () {
                oController._fnResetInlog();
                oController._fninitailLoad();
            }
        });
    });
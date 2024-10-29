sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, FilterOperator, Filter) {
        "use strict";
        var oRouter, oController, oMeterOutlogModel;
        return Controller.extend("com.lh.sapui5.zcrtinlogoutlog.controller.outlog", {
            onInit: function () {
                oController = this;
                var oMinDate = new Date();
                oMinDate.setDate(oMinDate.getDate() - 30);
                oMeterOutlogModel = oController.getOwnerComponent().getModel();
                oController.getView().setModel(new JSONModel({
                    oCurrentDate: new Date(),
                    oMinPostingDate: oMinDate
                }), "OutLogModel")
                oMeterOutlogModel.attachBatchRequestSent({}, function () {
                    oController.getView().setBusy(true);
                });
                oMeterOutlogModel.attachBatchRequestCompleted({}, function () {
                    oController.getView().setBusy(false);
                });
                oController._fnGetInitialload();
            },

            _fnGetInitialload: function () {
                oMeterOutlogModel.read("/MOInitialLoadSet", {
                    urlParameters: { '$expand': 'NavStorageLoc' },
                    success: function (oData, oResponse) {
                        var oResults = oData.results[0];
                        oController.getView().getModel("OutLogModel").setProperty("/InitialLoad", oResults)
                    }, error: function (oerror) {
                        debugger;
                    }
                });
            },

            onSearch: function () {
                var bIsValidated = true,
                    aFilter = [];
                // Validate the Logic and then if validation is suceesess go for read call
                if (bIsValidated) {
                    aFilter.push(new Filter("Equnr", FilterOperator.GE, '100000086'));
                    aFilter.push(new Filter("Equnr", FilterOperator.LE, '100000090'));
                    oController._fnGetDeviceDataSet(aFilter);
                }


            },

            _fnGetDeviceDataSet: function (aFilter) {
                // /ZDM_METER_OUTLOG_SRV/DeviceDataSet?$filter=( Equnr ge '100000086' and Equnr le '100000090' )
                oMeterOutlogModel.read("/DeviceDataSet", {
                    filters: aFilter,
                    success: function (oData, oResponse) {
                        debugger;
                        var oResults = oData.results[0];
                        oController.getView().getModel("OutLogModel").setProperty("/DeviceDataSet", oResults)
                    }, error: function (oerror) {
                        debugger;
                    }
                });
            }

        });
    });

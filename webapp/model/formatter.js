sap.ui.define([], () => {
	"use strict";

	return {
		AdjFieldVisibility: function (RecKwhFlag) {
			
			return (RecKwhFlag !== undefined);
		},
		fnDateFormate: function (oDate) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});
			return oDateFormat.format(oDate);
		},
		fnMessageType: function (sMessageType) {
			var sMessageTypeDesc;
			if (sMessageType === "E") {
				sMessageTypeDesc = "Error"
			} else if (sMessageType === "S") {
				sMessageTypeDesc = "Success"
			} else if (sMessageType === "W") {
				sMessageTypeDesc = "Warning"
			} else {
				sMessageTypeDesc = "None"
			}
			return sMessageTypeDesc;
		},
		fnReturnNaturalNumber: function (oValue) {
			var numberRegex = /\D+/g;
			var sUpdatedValue;
			sUpdatedValue = oValue.replace(numberRegex, '');
			return sUpdatedValue;
		}
	};
});
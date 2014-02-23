/*--------------------------------------------------------------
-- Translation keys & values
---------------------------------------------------------------*/
var transValues = {};
function loadTranslation(cb) {
    transValues = {
        SB_EMAIL_NOTIFIER_BUTTON_1ST_TIME_TOOLTIP: 'Check all your email accounts and see when you’ve got new messages. ',
        SB_EMAIL_NOTIFIER_NO_MSGS_TOOLTIP: 'No new messages',
        SB_EMAIL_NOTIFIER_SINGLE_MSG_TOOLTIP: '1 new message',
        SB_EMAIL_NOTIFIER_MULTI_MSG_TOOLTIP: '{0} new messages',
        SB_EMAIL_NOTIFIER_ADD_TITLE_BAR: 'New Account',
        SB_EMAIL_NOTIFIER_1ST_RADIO_BUTTON: 'Webmail account (accessed from the browser, such as Gmail and  Hotmail)',
        SB_EMAIL_NOTIFIER_EMAIL_FIELD: 'Email address:',
        SB_EMAIL_NOTIFIER_PASSWORD_FIELD: 'Password:',
        SB_EMAIL_NOTIFIER_2ND_RADIO_BUTTON: 'POP3  account (usually opened with a program like Outlook)',
        SB_EMAIL_NOTIFIER_SECURITY_MSG: 'Your password is stored in your own Email Notifier and is not used for any purpose other than accessing your account.',
        SB_EMAIL_NOTIFIER_BTN_YES: 'Yes',
        SB_EMAIL_NOTIFIER_BTN_NO: 'No',
        SB_EMAIL_NOTIFIER_BTN_ADD: 'Add',
        SB_EMAIL_NOTIFIER_BTN_CANCEL: 'Cancel',
        SB_EMAIL_NOTIFIER_BTN_SAVE: 'Save',
        SB_EMAIL_NOTIFIER_BTN_RETRY: 'Retry',
        SB_EMAIL_NOTIFIER_MNG_ACTS_LINK: 'Manage accounts',
        SB_EMAIL_NOTIFIER_PROCESS_MSG_1: 'Verifying email account domain',
        SB_EMAIL_NOTIFIER_PROCESS_MSG_2: 'Logging in to mail server',
        SB_EMAIL_NOTIFIER_PROCESS_MSG_3: 'Testing email account',
        SB_EMAIL_NOTIFIER_SUCCESS_MSG: 'The account was added successfully.',
        SB_EMAIL_NOTIFIER_FAILED_REASON_EXISTS_MSG: 'You have already added this e-mail account.',
        SB_EMAIL_NOTIFIER_FAILED_NOTSUPPORTED_MSG: 'If the domain is correct, then chances are it is not supported by the Email Notifier. Check back again, because we continually update our domain list.',
        SB_EMAIL_NOTIFIER_VALIDATION_FAILED: 'Please correct the email address, if necessary, and try again.',
        SB_EMAIL_NOTIFIER_FAILED_WRONG_EMAIL: 'We cannot find an account with the email address and password you entered. Please try again.',
        SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT: 'We cannot connect to the server and port number you entered. Please try again.',
        SB_EMAIL_NOTIFIER_NEW_ACCOUNT_USERNAME: 'Username:',
        SB_EMAIL_NOTIFIER_NEW_ACCOUNT_PASSWORD: 'Password:',
        SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_SERVER: 'Incoming POP3 Server:',
        SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_PORT: 'Port number:',
        SB_EMAIL_NOTIFIER_MAIN_TITLE: 'Mail',
        SB_EMAIL_NOTIFIER_MAIN_LINK: 'Manage accounts',
        SB_EMAIL_NOTIFIER_MAIN_LST_UPDATED: 'Last updated at:', // <time>
        SB_EMAIL_NOTIFIER_MAIN_RETREIVE_MAIL: 'Retrieve mail every <#> minutes',
        SB_EMAIL_NOTIFIER_MAIN_MORE_TEXT: 'More…',
        SB_EMAIL_NOTIFIER_MNG_TITLE: 'Manage Accounts',
        SB_EMAIL_NOTIFIER_MNG_EDIT_BTN: 'Edit',
        SB_EMAIL_NOTIFIER_MNG_REMOVE_BTN: 'Remove',
        SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TITLE: 'Remove Account',
        SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TEXT: 'You are about to remove the account: <email address>.<br/>Are you sure you want to continue?',
        SB_EMAIL_NOTIFIER_MNG_ADD_LINK: 'Add new account',
        SB_EMAIL_NOTIFIER_MNG_CANCEL_LINK: 'Cancel',
        SB_EMAIL_NOTIFIER_EDIT_ACT_TITLE: 'Edit Account',
        SB_EMAIL_NOTIFIER_EDIT_WEB_ACT_TITLE: 'Webmail Account',
        SB_EMAIL_NOTIFIER_EDIT_POP3_ACT_TITLE: 'POP3 Account',
        SB_EMAIL_NOTIFIER_CONFIRMATION_POPUP_TITLE: 'Confirmation Message',
        SB_EMAIL_NOTIFIER_ERROR_POPUP_TITLE: 'Error Message',
        SB_EMAIL_NOTIFIER_NO_SUBJECT: '<No Subject>',
        SB_EMAIL_NOTIFIER_EDIT_ACCOUNT_DETAILS: "Edit account's details",
        SB_EMAIL_NOTIFIER_RETREIVE_ACCOUNT_MAILS_FAILED: 'Retrieve mails for this account failed',
        SB_EMAIL_NOTIFIER_RETREIEVE_INTERVAL_LABEL: 'Retrieve mail every',
        SB_EMAIL_NOTIFIER_RETREIEVE_INTERVAL_MINUTES:'minutes',
        SB_EMAIL_NOTIFIER_ADD_NEW_ACCOUNT_CANCEL_DIALOG_BODY:'The account “{0}” will not be added.\nAre you sure you want to cancel?'
    };


    conduit.advanced.localization.getKey(
		[
			'SB_EMAIL_NOTIFIER_BUTTON_1ST_TIME_TOOLTIP',
			'SB_EMAIL_NOTIFIER_NO_MSGS_TOOLTIP',
			'SB_EMAIL_NOTIFIER_SINGLE_MSG_TOOLTIP',
			'SB_EMAIL_NOTIFIER_MULTI_MSG_TOOLTIP',
			'SB_EMAIL_NOTIFIER_ADD_TITLE_BAR',
			'SB_EMAIL_NOTIFIER_EMAIL_FIELD',
			'SB_EMAIL_NOTIFIER_1ST_RADIO_BUTTON',
			'SB_EMAIL_NOTIFIER_PASSWORD_FIELD',
			'SB_EMAIL_NOTIFIER_2ND_RADIO_BUTTON',
			'SB_EMAIL_NOTIFIER_SECURITY_MSG',
			'SB_EMAIL_NOTIFIER_BTN_YES',
            'SB_EMAIL_NOTIFIER_BTN_NO',
			'SB_EMAIL_NOTIFIER_BTN_ADD',
			'SB_EMAIL_NOTIFIER_BTN_CANCEL',
			'SB_EMAIL_NOTIFIER_BTN_SAVE',
            'SB_EMAIL_NOTIFIER_BTN_RETRY',
			'SB_EMAIL_NOTIFIER_MNG_ACTS_LINK',
			'SB_EMAIL_NOTIFIER_PROCESS_MSG_1',
			'SB_EMAIL_NOTIFIER_PROCESS_MSG_2',
			'SB_EMAIL_NOTIFIER_PROCESS_MSG_3',
			'SB_EMAIL_NOTIFIER_SUCCESS_MSG',
			'SB_EMAIL_NOTIFIER_FAILED_REASON_EXISTS_MSG',
			'SB_EMAIL_NOTIFIER_FAILED_NOTSUPPORTED_MSG',
			'SB_EMAIL_NOTIFIER_VALIDATION_FAILED',
			'SB_EMAIL_NOTIFIER_FAILED_WRONG_EMAIL',
			'SB_EMAIL_NOTIFIER_NEW_ACCOUNT_USERNAME',
			'SB_EMAIL_NOTIFIER_NEW_ACCOUNT_PASSWORD',
			'SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_SERVER',
			'SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_PORT',
			'SB_EMAIL_NOTIFIER_MAIN_TITLE',
			'SB_EMAIL_NOTIFIER_MAIN_LINK',
			'SB_EMAIL_NOTIFIER_MAIN_LST_UPDATED',
			'SB_EMAIL_NOTIFIER_MAIN_RETREIVE_MAIL',
			'SB_EMAIL_NOTIFIER_MAIN_MORE_TEXT',
			'SB_EMAIL_NOTIFIER_MNG_TITLE',
			'SB_EMAIL_NOTIFIER_MNG_EDIT_BTN',
			'SB_EMAIL_NOTIFIER_MNG_REMOVE_BTN',
			'SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TITLE',
			'SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TEXT',
			'SB_EMAIL_NOTIFIER_MNG_ADD_LINK',
			'SB_EMAIL_NOTIFIER_MNG_CANCEL_LINK',
			'SB_EMAIL_NOTIFIER_EDIT_ACT_TITLE',
			'SB_EMAIL_NOTIFIER_EDIT_WEB_ACT_TITLE',
			'SB_EMAIL_NOTIFIER_EDIT_POP3_ACT_TITLE',
            'SB_EMAIL_NOTIFIER_CONFIRMATION_POPUP_TITLE',
            'SB_EMAIL_NOTIFIER_ERROR_POPUP_TITLE',
            'SB_EMAIL_NOTIFIER_NO_SUBJECT',
            'SB_EMAIL_NOTIFIER_EDIT_ACCOUNT_DETAILS',
            'SB_EMAIL_NOTIFIER_RETREIVE_ACCOUNT_MAILS_FAILED',
            'SB_EMAIL_NOTIFIER_RETREIEVE_INTERVAL_LABEL',
            'SB_EMAIL_NOTIFIER_RETREIEVE_INTERVAL_MINUTES'
            ,'SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'
            ,'SB_EMAIL_NOTIFIER_ADD_NEW_ACCOUNT_CANCEL_DIALOG_BODY'
		],
		function (result) {
		    for (var item in transValues) {
		        if (typeof result[item] == 'string') {
		            transValues[item] = result[item];
		        }
		    }
            cb && cb();
		});
}

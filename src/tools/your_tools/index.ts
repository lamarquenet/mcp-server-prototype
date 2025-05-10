import { getInfoTool } from "./getInfo.js";
import { sayHelloTool } from "./sayHello.js";
import { chatWithOpenAiTool } from "./chatGptCompletion.js";

export const yourTools = new Map<string, any>();

yourTools.set(getInfoTool.name, getInfoTool);
yourTools.set(sayHelloTool.name, sayHelloTool);
yourTools.set(chatWithOpenAiTool.name, chatWithOpenAiTool);


//Gmail tools
import { batchDeleteEmailsTool } from "./google/mail/batchDeleteEmails.js";
import { batchModifyEmailsTool } from "./google/mail/batchModifyEmails.js";
import { createLabelTool } from "./google/mail/createLabel.js";
import { deleteEmailTool } from "./google/mail/deleteEmail.js";
import { deleteLabelTool } from "./google/mail/deleteLabel.js";
import { draftEmailTool } from "./google/mail/draftEmail.js";
import { getOrCreateLabelTool } from "./google/mail/getOrCreateLabel.js";
import { listEmailLabelsTool } from "./google/mail/listEmailLabels.js";
import { modifyEmailTool } from "./google/mail/modifyEmail.js";
import { readEmailTool } from "./google/mail/readEmail.js";
import { searchEmailsTool } from "./google/mail/searchEmails.js";
import { sendEmailTool } from "./google/mail/sendMails.js";
import { updateLabelTool } from "./google/mail/updateLabel.js";

yourTools.set(batchDeleteEmailsTool.name, batchDeleteEmailsTool);
yourTools.set(batchModifyEmailsTool.name, batchModifyEmailsTool);
yourTools.set(createLabelTool.name, createLabelTool);
yourTools.set(deleteEmailTool.name, deleteEmailTool);
yourTools.set(deleteLabelTool.name, deleteLabelTool);
yourTools.set(draftEmailTool.name, draftEmailTool);
yourTools.set(getOrCreateLabelTool.name, getOrCreateLabelTool);
yourTools.set(listEmailLabelsTool.name, listEmailLabelsTool);
yourTools.set(modifyEmailTool.name, modifyEmailTool);
yourTools.set(readEmailTool.name, readEmailTool);
yourTools.set(searchEmailsTool.name, searchEmailsTool);
yourTools.set(sendEmailTool.name, sendEmailTool);
yourTools.set(updateLabelTool.name, updateLabelTool);


// Add more tools as needed
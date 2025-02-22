/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { expect, test } = require('@playwright/test');
const converter = require('../../features/dc/converter_L1.spec.js');
const parse = require('../../features/parse.js');
const selectors = require('../../selectors/dc_converter.selectors.js');

const { name, features } = parse(converter);
test.describe(`${name}`, () => {
  features.forEach((props) => {
    test(props.title, async ({ page, browser }) => {
      const { url, title } = props;
      const converterBlock = page.locator(selectors['@pdf-converter']);
      const fileInput = page.locator(selectors['@pdf-file-upload-input']);
      const pdfComplete = page.locator(selectors['@pdf-complete']);
      const filePreview = page.locator(selectors['@file-preview']);
      // Known issue in Chrome and Helix URLs with Google Sign-in prompt (MWPW-126913, MWPW-123890)
      let googleCTA = page.locator(selectors['@google-cta']);
      if (browser.browserType().name() !== 'chromium' && /stage|prod/.test(title)) {
        googleCTA = page.locator(selectors['@google-yolo']);
      }
      const adobeCTA = page.locator(selectors['@adobe-cta']);
      const failedBlock = page.locator(selectors['@widget-block-failed']);

      await page.goto(props.url);

      await expect(converterBlock).toBeVisible();
      if (await failedBlock.isVisible()) {
        console.log(`${browser.browserType().name()}: ${await failedBlock.getAttribute('data-reason')} on ${url}`);
        await expect.soft(failedBlock).not.toBeVisible();
      }

      // Upload a test document
      // Increasing the timeout to 10s due to a known bug (MWPW-125603).
      await expect(fileInput).toBeVisible({ timeout: 10000 });
      await fileInput.setInputFiles(url.includes('split-pdf') ? 'docs/dc/Multipage_PDF.pdf' : 'docs/dc/Small_PDF.pdf');

      // Wait for conversion to complete
      // DC Web services can sometimes be slow but do not wait for more than 30s
      await expect(pdfComplete).toBeVisible({ timeout: 30000 });

      // Wait for file preview
      await expect(filePreview).toBeVisible();

      // Wait for social CTAs
      await expect(googleCTA).toBeVisible();
      await expect(adobeCTA).toBeVisible();
    });
  });
});

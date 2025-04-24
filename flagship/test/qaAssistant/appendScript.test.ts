/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from '@jest/globals';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import { appendScript } from '../../src/qaAssistant/appendScript';
import { FS_QA_ASSISTANT_SCRIPT_TAG_ID,
  QA_ASSISTANT_LOCAL_URL,
  QA_ASSISTANT_PROD_URL } from '../../src/enum/FlagshipConstant';

describe('Test appendScript', () => {
  const config = new DecisionApiConfig();
  config.envId = 'envId';

  it('should append production script to the document', () => {
    appendScript(QA_ASSISTANT_PROD_URL);

    const tagScript = document.getElementById(
      FS_QA_ASSISTANT_SCRIPT_TAG_ID
    ) as HTMLScriptElement | null;
    expect(tagScript).toBeDefined();
    expect(tagScript?.src).toBe(QA_ASSISTANT_PROD_URL);
    expect(tagScript?.crossOrigin).toBe('');
    expect(tagScript).toMatchSnapshot();
  });

  it('should append local script to the document with anonymous cross-origin', () => {
    let tagScript = document.getElementById(
      FS_QA_ASSISTANT_SCRIPT_TAG_ID
    ) as HTMLScriptElement | null;
    tagScript?.remove();

    appendScript(QA_ASSISTANT_LOCAL_URL);

    tagScript = document.getElementById(
      FS_QA_ASSISTANT_SCRIPT_TAG_ID
    ) as HTMLScriptElement | null;
    expect(tagScript).toBeDefined();
    expect(tagScript?.src).toBe(QA_ASSISTANT_LOCAL_URL);
    expect(tagScript?.crossOrigin).toBe('anonymous');
    expect(tagScript).toMatchSnapshot();
  });
});

import * as allDeprecationWarnings from './deprecation';

jest.spyOn(console, 'info').mockImplementation(() => {});
const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('deprecation warnings', () => {
  // so we do not have to update the tests each new version - just grab one warning export
  const [removedInWagtailVersionWarning] = Object.values(
    allDeprecationWarnings,
  );

  it('should export a warning function', () => {
    expect(removedInWagtailVersionWarning).toBeInstanceOf(Function);
  });

  it('should not dispatch any warning if not enabled', () => {
    expect(warn).not.toHaveBeenCalled();
    removedInWagtailVersionWarning('message');
    expect(warn).not.toHaveBeenCalled();
  });

  it('should dispatch a warning if enabled via custom event dispatch', () => {
    expect(warn).not.toHaveBeenCalled();
    document.dispatchEvent(new CustomEvent('wagtail:debug-enable'));
    removedInWagtailVersionWarning('message');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('message', { version: '5.0' });

    // disable again
    expect(warn).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new CustomEvent('wagtail:debug-disable'));
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

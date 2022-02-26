import * as React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'js-cookie';

import { BaseController } from '../../controllers/base-controller';
import { STRINGS } from '../../config/wagtailConfig';

import { Sidebar } from './Sidebar';

export const SIDEBAR_COLLAPSED_COOKIE_NAME = 'wagtail_sidebar_collapsed';

export class MainMenuController extends BaseController {
  cookieOptionsValue: { sameSite: string };
  hasPropsTarget: boolean;
  propsTarget: HTMLElement;

  static values = {
    cookieOptions: { default: { sameSite: 'lax' }, type: Object },
  };

  static targets = ['props'];

  connect(): void {
    // const element = document.getElementById('wagtail-sidebar');
    const element = this.element;

    // const rawProps = document.getElementById('wagtail-sidebar-props');
    // json_script does not allow for data-attrs - would be good to have this
    const rawProps = this.hasPropsTarget
      ? this.propsTarget
      : document.getElementById('wagtail-sidebar-props');

    if (!rawProps?.textContent) return;

    const event = this.dispatch('init', { cancelable: true });
    if (event.defaultPrevented) return;

    const { modules } = window.telepath.unpack(
      JSON.parse(rawProps.textContent),
    );

    ReactDOM.render(
      <Sidebar
        modules={modules}
        strings={STRINGS}
        collapsedOnLoad={this.getCollapsed()}
        currentPath={window.location.pathname}
        navigate={(_) => this.navigate(_)}
        onExpandCollapse={(_collapsed) => this.expandCollapse(_collapsed)}
      />,
      element,
      () => {
        this.ready();
      },
    );
  }

  navigate(url: string) {
    window.location.href = url;

    // Return a promise that never resolves.
    // This promise is used to indicate to any open submenus that the next page has loaded and it should close.
    // As all navigation from the menu at the moment takes the user to another page, we don't need to close the menus.
    // We will need to update this if we later add the ability to render views on the client side.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Promise<void>(() => {});
  }

  expandCollapse(_collapsed: boolean) {
    // const cookieOptions = { sameSite: 'lax' };
    const cookieOptions = this.cookieOptionsValue;

    if (_collapsed) {
      document.body.classList.add('sidebar-collapsed');
      Cookies.set(SIDEBAR_COLLAPSED_COOKIE_NAME, 1, cookieOptions);
    } else {
      document.body.classList.remove('sidebar-collapsed');
      Cookies.set(SIDEBAR_COLLAPSED_COOKIE_NAME, 0, cookieOptions);
    }
  }

  getCollapsed() {
    const collapsedCookie: any = Cookies.get(SIDEBAR_COLLAPSED_COOKIE_NAME);
    // Cast to boolean
    return !(collapsedCookie === undefined || collapsedCookie === '0');
  }

  ready() {
    document.body.classList.add('ready');
    this.dispatch('ready', { cancelable: false });
  }
}

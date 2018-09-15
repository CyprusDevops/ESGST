import {utils} from '../../lib/jsUtils'
import Module from '../../class/Module';

class UsersWhitelistBlacklistManager extends Module {
info = ({
    description: `
      <ul>
        <li>Adds a button (<i class="fa fa-arrow-up"></i> <i class="fa fa-arrow-down"></i> <i class="fa fa-trash"></i>) to the main page heading of your <a href="https://www.steamgifts.com/account/manage/whitelist">whitelist</a>/<a href="https://www.steamgifts.com/account/manage/blacklist">blacklist</a> pages that allows you to import/export/clear your whitelist/blacklist.</li>
      </ul>
    `,
    id: `wbm`,
    load: this.wbm,
    name: `Whitelist/Blacklist Manager`,
    sg: true,
    type: `users`
  });

  wbm() {
    if (!this.esgst.whitelistPath && !this.esgst.blacklistPath) return;
    let wbm = {};
    if (this.esgst.whitelistPath) {
      this.wbm.key = `whitelist`;
      this.wbm.name = `Whitelist`;
    } else {
      this.wbm.key = `blacklist`;
      this.wbm.name = `Blacklist`;
    }
    this.wbm.button = this.esgst.modules.common.createHeadingButton({id: `wbm`, icons: [`fa-arrow-up`, `fa-arrow-down`, `fa-trash`], title: `Manage ${wbm.key}`});
    this.wbm.button.addEventListener(`click`, this.wbm_openPopup.bind(null, this.wbm));
  }

  wbm_openPopup(wbm) {
    if (!wbm.popup) {
      this.wbm.popup = new Popup(`fa-gear`, `Manage ${wbm.name}:`);
      new ToggleSwitch(wbm.popup.description, `wbm_useCache`, false, `Use cache.`, false, false, `Uses the cache created the last time you synced your whitelist/blacklist. This speeds up the process, but could lead to incomplete results if your cache isn't up-to-date.`, this.esgst.wbm_useCache);
      new ToggleSwitch(wbm.popup.description, `wbm_clearTags`, false, [{
        text: `Only clear users who are tagged with these specific tags (separate with comma): `,
        type: `node`
      }, {
        attributes: {
          class: `esgst-switch-input esgst-switch-input-large`,
          type: `text`,
          value: this.esgst.wbm_tags.join(`, `)
        },
        type: `input`
      }], false, false, `Uses the User Tags database to remove only users with the specified tags.`, this.esgst.wbm_clearTags).name.firstElementChild.addEventListener(`change`, event => {
        let tags = event.currentTarget.value.replace(/(,\s*)+/g, this.esgst.modules.common.formatTags).split(`, `);
        this.esgst.modules.common.setSetting(`wbm_tags`, tags);
        this.esgst.wbm_tags = tags;
      });
      this.wbm.input = this.esgst.modules.common.createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          type: `file`
        },
        type: `input`
      }]);
      this.wbm.message = this.esgst.modules.common.createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          class: `esgst-description`
        },
        type: `div`
      }]);
      this.wbm.warning = this.esgst.modules.common.createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          class: `esgst-description esgst-warning`
        },
        type: `div`
      }]);
      this.wbm.popup.description.appendChild(new ButtonSet(`green`, `grey`, `fa-arrow-up`, `fa-times`, `Import`, `Cancel`, this.wbm_start.bind(null, this.wbm, this.wbm_importList.bind(null, this.wbm)), this.wbm_cancel.bind(null, this.wbm)).set);
      this.wbm.popup.description.appendChild(new ButtonSet(`green`, `grey`, `fa-arrow-down`, `fa-times`, `Export`, `Cancel`, this.wbm_start.bind(null, this.wbm, this.wbm_exportList.bind(null, this.wbm, [], 1)), this.wbm_cancel.bind(null, this.wbm)).set);
      this.wbm.popup.description.appendChild(new ButtonSet(`green`, `grey`, `fa-trash`, `fa-times`, `Clear`, `Cancel`, this.wbm_start.bind(null, this.wbm, this.wbm_clearList.bind(null, this.wbm, [], 1)), this.wbm_cancel.bind(null, this.wbm)).set);
      this.wbm.results = this.esgst.modules.common.createElements(wbm.popup.scrollable,  `beforeEnd`, [{
        type: `div`
      }]);
    }
    this.wbm.popup.open();
  }

  wbm_start(wbm, callback, mainCallback) {
    this.esgst.modules.common.createConfirmation(`Are you sure you want to do this?`, () => {
      this.wbm.isCanceled = false;
      this.wbm.button.classList.add(`esgst-busy`);
      this.wbm.usernames = [];
      this.wbm.results.innerHTML = ``;
      callback(wbm_complete.bind(null, this.wbm, mainCallback));
    }, mainCallback);
  }

  wbm_complete(wbm, callback) {
    this.wbm.button.classList.remove(`esgst-busy`);
    callback();
  }

  wbm_cancel(wbm) {
    this.wbm.isCanceled = true;
    this.wbm.button.classList.remove(`esgst-busy`);
  }

  wbm_importList(wbm, callback) {
    let file = this.wbm.input.files[0];
    if (file) {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        try {
          let list = JSON.parse(reader.result);
          this.wbm_insertUsers(wbm, list, 0, list.length, callback);
        } catch (error) {
          this.esgst.modules.common.createFadeMessage(wbm.warning, `Cannot this.esgst.modules.giveawaysGiveawayFilters.parse file!`);
          callback();
        }
      };
    } else {
      this.esgst.modules.common.createFadeMessage(wbm.warning, `No file was loaded!`);
      callback();
    }
  }

  async wbm_insertUsers(wbm, list, i, n, callback) {
    if (wbm.isCanceled) return;
    this.esgst.modules.common.createElements(wbm.message, `inner`, [{
      attributes: {
        class: `fa fa-circle-o-notch fa-spin`
      },
      type: `i`
    }, {
      text: `Importing list (${i} of ${n})...`,
      type: `span`
    }]);
    if (i < n) {
      await this.esgst.modules.common.request({data: `xsrf_token=${this.esgst.xsrfToken}&do=${wbm.key}&action=insert&child_user_id=${list[i]}`, method: `POST`, url: `/ajax.php`});
      setTimeout(() => this.wbm_insertUsers(wbm, list, ++i, n, callback), 0);
    } else {
      this.esgst.modules.common.createFadeMessage(wbm.message, `List imported with success!`);
      callback();
    }
  }

  async wbm_exportList(wbm, list, nextPage, callback) {
    if (wbm.isCanceled) return;
    if (this.esgst.wbm_useCache) {
      let steamId;
      for (steamId in this.esgst.users.users) {
        if (this.esgst.users.users[steamId][`${wbm.key}ed`]) {
          list.push(this.esgst.users.users[steamId].id);
        }
      }
      this.esgst.modules.common.downloadFile(JSON.stringify(list), `esgst_${wbm.key}_${new Date().toISOString()}.json`);
      this.esgst.modules.common.createFadeMessage(wbm.message, `List exported with success!`);
      callback();
    } else {
      this.esgst.modules.common.createElements(wbm.message, `inner`, [{
        attributes: {
          class: `fa fa-circle-o-notch fa-spin`
        },
        type: `i`
      }, {
        text: `Retrieving list (page ${nextPage})...`,
        type: `span`
      }]);
      let elements, i, n, pagination, responseHtml;
      responseHtml = utils.parseHtml((await this.esgst.modules.common.request({method: `GET`, url: `https://www.steamgifts.com/account/manage/${wbm.key}/search?page=${nextPage}`})).responseText);
      elements = responseHtml.querySelectorAll(`[name="child_user_id"]`);
      for (i = 0, n = elements.length; i < n; ++i) {
        list.push(elements[i].value);
      }
      pagination = responseHtml.getElementsByClassName(`pagination__navigation`)[0];
      if (pagination && !pagination.lastElementChild.classList.contains(`is-selected`)) {
        setTimeout(() => this.wbm_exportList(wbm, list, ++nextPage, callback), 0);
      } else {
        this.esgst.modules.common.downloadFile(JSON.stringify(list), `esgst_${wbm.key}_${new Date().toISOString()}.json`);
        this.esgst.modules.common.createFadeMessage(wbm.message, `List exported with success!`);
        callback();
      }
    }
  }

  async wbm_clearList(wbm, list, nextPage, callback) {
    if (wbm.isCanceled) return;
    if (this.esgst.wbm_useCache) {
      let steamId;
      for (steamId in this.esgst.users.users) {
        let user = this.esgst.users.users[steamId];
        if (user[`${wbm.key}ed`]) {
          if (this.esgst.wbm_clearTags) {
            if (user.tags) {
              let i;
              for (i = user.tags.length - 1; i > -1 && this.esgst.wbm_tags.indexOf(user.tags[i]) < 0; --i);
              if (i > -1) {
                list.push(user.id);
                this.wbm.usernames.push(user.username);
              }
            }
          } else {
            list.push(user.id);
          }
        }
      }
      this.wbm_deleteUsers(wbm, list, 0, list.length, callback);
    } else {
      this.esgst.modules.common.createElements(wbm.message, `inner`, [{
        attributes: {
          class: `fa fa-circle-o-notch fa-spin`
        },
        type: `i`
      }, {
        text: `Retrieving list (page ${nextPage})...`,
        type: `span`
      }]);
      let element, elements, i, n, pagination, responseHtml;
      responseHtml = utils.parseHtml((await this.esgst.modules.common.request({method: `GET`, url: `https://www.steamgifts.com/account/manage/${wbm.key}/search?page=${nextPage}`})).responseText);
      elements = responseHtml.querySelectorAll(`[name="child_user_id"]`);
      for (i = 0, n = elements.length; i < n; ++i) {
        element = elements[i];
        if (this.esgst.wbm_clearTags) {
          let steamId, username;
          username = element.closest(`.table__row-inner-wrap`).getElementsByClassName(`table__column__heading`)[0].textContent;
          steamId = this.esgst.users.steamIds[username];
          if (steamId) {
            let user = this.esgst.users.users[steamId];
            if (user.tags) {
              let j;
              for (j = user.tags.length - 1; j > -1 && this.esgst.wbm_tags.indexOf(user.tags[j]) < 0; --j);
              if (j > -1) {
                list.push(element.value);
                this.wbm.usernames.push(username);
              }
            }
          }
        } else {
          list.push(element.value);
        }
      }
      pagination = responseHtml.getElementsByClassName(`pagination__navigation`)[0];
      if (pagination && !pagination.lastElementChild.classList.contains(`is-selected`)) {
        setTimeout(() => this.wbm_clearList(wbm, list, ++nextPage, callback), 0);
      } else {
        this.wbm_deleteUsers(wbm, list, 0, list.length, callback);
      }
    }
  }

  async wbm_deleteUsers(wbm, list, i, n, callback) {
    if (wbm.isCanceled) return;
    this.esgst.modules.common.createElements(wbm.message, `inner`, [{
      attributes: {
        class: `fa fa-circle-o-notch fa-spin`
      },
      type: `i`
    }, {
      text: `Clearing list (${i} of ${n})...`,
      type: `span`
    }]);
    if (i < n) {
      await this.esgst.modules.common.request({data: `xsrf_token=${this.esgst.xsrfToken}&do=${wbm.key}&action=delete&child_user_id=${list[i]}`, method: `POST`, url: `/ajax.php`});
      setTimeout(() => this.wbm_deleteUsers(wbm, list, ++i, n, callback), 0);
    } else {
      this.esgst.modules.common.createFadeMessage(wbm.message, `List cleared with success!`);
      this.esgst.modules.common.createElements(wbm.results, `inner`, [{
        attributes: {
          class: `esgst-bold`
        },
        text: `Users cleared (${wbm.usernames.length}):`,
        type: `span`
      }, {
        attributes: {
          class: `esgst-popup-actions`
        },
        type: `span`
      }]);
      this.wbm.usernames.forEach(username => {
        this.esgst.modules.common.createElements(wbm.results.lastElementChild, `beforeEnd`, [{
          attributes: {
            href: `/user/${username}`
          },
          text: username,
          type: `a`
        }]);
      });
      callback();
    }
  }
}

export default UsersWhitelistBlacklistManager;
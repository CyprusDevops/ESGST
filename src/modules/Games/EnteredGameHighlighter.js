import Module from '../../class/Module';

class GamesEnteredGameHighlighter extends Module {
info = ({
    description: `
      <ul>
        <li>Adds an icon (<i class="fa fa-star"></i>) next to a game's name (in any page) to indicate that you have entered giveaways for the game in the past. Clicking on the icon unhighlights the game.</li>
        <li>A game is only highlighted if you entered a giveaway for it after this feature was enabled.</li>
      </ul>
    `,
    id: `egh`,
    load: this.egh,
    name: `Entered Game Highlighter`,
    sg: true,
    type: `games`
  });

  egh() {
    this.esgst.gameFeatures.push(egh_getGames);
  }

  egh_getGames(games) {
    for (const game of games.all) {
      if (this.esgst.giveawayPath) {
        let button = document.querySelector(`.sidebar__entry-insert`);
        if (button) {
          button.addEventListener(`click`, this.egh_saveGame.bind(null, game.id, game.type));
        }
      }
      if (!this.esgst.menuPath && this.esgst.games[game.type][game.id] && this.esgst.games[game.type][game.id].entered && !game.container.getElementsByClassName(`esgst-egh-button`)[0]) {
        this.esgst.modules.common.createElements((game.container.closest(`.poll`) && game.container.getElementsByClassName(`table__column__heading`)[0]) || game.headingName, `beforeBegin`, [{
          attributes: {
            class: `esgst-egh-button`,
            title: this.esgst.modules.common.getFeatureTooltip(`egh`, `You have entered giveaways for this game before. Click to unhighlight it`)
          },
          type: `a`,
          children: [{
            attributes: {
              class: `fa fa-star esgst-egh-icon`
            },
            type: `i`
          }]
        }]).addEventListener(`click`, this.egh_unhighlightGame.bind(null, game.id, game.type));
      }
    }
  }

  async egh_saveGame(id, type) {
    let games;
    if (id && type) {
      games = JSON.parse(await getValue(`games`));
      if (!games[type][id] || !games[type][id].entered) {
        let deleteLock = await this.esgst.modules.common.createLock(`gameLock`, 300);
        games = JSON.parse(await getValue(`games`));
        if (!games[type][id]) {
          games[type][id] = {};
        }
        games[type][id].entered = true;
        await setValue(`games`, JSON.stringify(games));
        deleteLock();
      }
    }
  }

  async egh_unhighlightGame(id, type, event) {
    let icon = event.currentTarget;
    if (icon.classList.contains(`fa-spin`)) return;
    this.esgst.modules.common.createElements(icon, `inner`, [{
      attributes: {
        class: `fa fa-circle-o-notch fa-spin`
      },
      type: `i`
    }]);
    let deleteLock = await this.esgst.modules.common.createLock(`gameLock`, 300);
    let games = JSON.parse(await getValue(`games`));
    delete games[type][id].entered;
    await setValue(`games`, JSON.stringify(games));
    icon.remove();
    deleteLock();
  }
}

export default GamesEnteredGameHighlighter;
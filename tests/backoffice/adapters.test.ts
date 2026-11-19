import { test } from "node:test";
import { brandingFromTenant, themeColors, themeProperties } from "../../src/lib/backoffice/branding";
import assert from "node:assert/strict";
import { ticketFromPanel, eventFromPanel, gridFromPanel, marketsFromPanel, searchEventsFromPanel } from "../../src/lib/backoffice/public-adapters";
import { leagueIdForName, panelLeagueGroups, searchLeagueGroups, sportsLeagueHref } from "../../src/lib/backoffice/sports-leagues";
import { selectionForEvent, type SportsEvent } from "../../src/lib/sports-data";
import { liveEventFromPanel, liveEventsFromPanel } from "../../src/lib/backoffice/live-markets";
test("receipt uses backend numeric amounts instead of formatted currency labels", () => {
  const ticket = ticketFromPanel({
    id: 1, status: "Perdeu", valor_apostado: "R$ 2,00", retorno_possivel: "R$ 7,50",
    bet_amount_value: 2, possible_return_value: 7.5, cotacao: "3,75",
    hunches: [{ id: 2, event_id: 3, home: "A", away: "B", market: "Vencedor",
      option: "Empate", price: "3.75", status: "Perdeu", datetime_iso: "2026-11-18T20:00:00-03:00" }],
  });
  assert.equal(ticket.stake, 2); assert.equal(ticket.odds, 3.75);
  assert.equal(ticket.potential, 7.5); assert.equal(ticket.picks.length, 1);
  assert.equal(ticket.canCancel, false);
});
test("mixed grid retains league and match IDs, suspended prices and original boosted price", () => {
  const events = gridFromPanel([{ type: "league", league: "Liga", league_id: 42 }, {
    id: 22, event_id: 9999, home: "Casa", away: "Fora", datetime_iso: "2026-11-18T20:00:00-03:00",
    odds: [{ id: 10, mk_id: 5, market: "Vencedor", option: "Casa", cotation: "2.30",
      boost: { original_cotation: "2.00", percent: 15 }, suspended: false },
      { id: 11, mk_id: 5, market: "Vencedor", option: "Fora", cotation: "1.90", suspended: true }],
  }]);
  assert.equal(events[0].id, "22"); assert.equal(events[0].league, "Liga");
  assert.equal(events[0].leagueId, "42");
  assert.equal(events[0].markets[0].options[0].odd, 2.3);
  assert.equal(events[0].markets[0].options[0].originalOdd, 2);
  assert.equal(events[0].markets[0].options[1].odd, null);
});
test("league links preserve panel IDs and only resolve unambiguous legacy names", () => {
  const groups = panelLeagueGroups([
    { key: "brasil", location: "Brasil", leagues: [
      { league_id: 1789, league: "Brasileirão Série A" }, { league_id: 42, league: "Série A" },
    ] },
    { key: "italia", location: "Itália", leagues: [{ league_id: 43, league: "Série A" }] },
  ]);
  const leagues = groups.flatMap((group) => group.leagues);
  assert.equal(leagueIdForName("Série A", leagues), undefined);
  assert.equal(leagueIdForName("Itália: Série A", leagues), "43");
  assert.equal(leagueIdForName("Brasil - Série A", leagues), "42");
  assert.equal(leagueIdForName("Brasil - Série A", leagues.filter(({ id }) => id !== "42")), "1789");
  assert.equal(sportsLeagueHref("football", leagueIdForName("Brasileirão Série A", leagues)), "/esportes/football?liga=1789");
  assert.deepEqual(searchLeagueGroups("serie a", [...groups, groups[0]]).map((item) => item.id), ["1789", "42", "43"]);
  assert.deepEqual(searchLeagueGroups("Liga dos Campeões da UEFA", panelLeagueGroups([
    { key: "europa", location: "Europa", leagues: [{ league_id: 2197, league: "UEFA Champions League" }] },
  ])).map((item) => item.id), ["2197"]);
  assert.equal(eventFromPanel({ id: 12, league_id: 10, sport: "Basquete", home: "A", away: "B" }).sport, "basketball");
});
test("search results use the match ID from the panel, keep its ordering and need no odds", () => {
  const rows = [12, 7].map((id) => ({
    id, event_id: "ext-" + id, sport: "soccer", home: "A", away: "B", league: "Série A",
    home_img: "team-a.png", away_img: "no-flag.png", date: "2026-11-20 19:00:00",
  }));
  const events = searchEventsFromPanel(rows);
  assert.deepEqual(events.map((event) => event.id), ["12", "7"]);
  assert.equal(events[0].start, "2026-11-20T19:00:00-03:00");
  assert.match(events[0].homeLogo!, /\/flags\/medium\/team-a\.png$/);
  assert.equal(events[0].awayLogo, "");
  assert.deepEqual(events[0].markets, []);
});
test("detail merges flat and grouped odds by the panel ID and keeps each distinct selection", () => {
  const event: SportsEvent = { id: "1163531", sport: "football", league: "Série A", leagueId: "1",
    home: "Remo", away: "Chapecoense", start: "", status: "prematch", markets: [] };
  const score = { id: 61645390, mk_id: 35000, op_id: 35003, label: "2X0", cotation: "8.35" };
  const alternate = { ...score, id: 61645391, op_id: 35004, label: "2X1", cotation: "12.00", suspended: true };
  const { markets } = marketsFromPanel({ markets: [{
    internal: "placar-exato-tempo-completo", market: "Placar Exato Tempo Completo",
    odds: [score, { ...score }],
    items: [{ name: "Casa", odds: [{ ...score, id: String(score.id), cotation: "9.00" }, alternate] },
      { name: "Outras", odds: [alternate] }],
  }] }, event, "Popular");
  const [market] = markets;
  assert.deepEqual(market.options.map(({ id, odd }) => [id, odd]), [["61645390", 8.35], ["61645391", null]]);
  const selection = selectionForEvent({ ...event, markets }, {
    eventId: event.id, marketId: market.id, selectionId: String(score.id),
  });
  assert.equal(selection?.selectionId, "61645390");
  assert.equal(selection?.optionCode, 35003);
});
test("active CDN colors override tenant defaults and reject values outside the theme contract", () => {
  const theme = themeColors({ dark_bg: "#07110b", dark_surface: "rgba(30, 40, 50, 0.8)",
    light_line: "rgb(260, 0, 0)", dark_price: "url(https://example.test)" });
  const branding = brandingFromTenant({
    site_id: "partner", front_url: "partner.test", base_url: "painel.partner.test",
    complete_name: "Banca Parceira", status: "actived", modules: [],
    logo_url: "https://cdn.example.test/partner.webp", isotype_url: "javascript:invalid",
    custom_theme: { brand: "#1b6436", dark_bg: "#111111" },
  }, { settings: {}, medias: {}, theme });

  assert.equal(branding.name, "Banca Parceira");
  assert.equal(branding.logo, "https://cdn.example.test/partner.webp");
  assert.equal(branding.icon, undefined);
  assert.deepEqual(themeProperties(branding.theme), {
    "--tenant-brand": "#1b6436", "--tenant-dark-bg": "#07110b", "--tenant-dark-surface": "rgba(30, 40, 50, 0.8)",
  });
});
test("the live grid and event detail use identical selection IDs and adjusted prices", () => {
  const odd = { cotacao: "2.00", odd: "Casa", suspended: false };
  const game = { match_id: 555, event_id: 999, league_id: 42, home: "Time A", away: "Time B" };
  const grid = [{ league_id: 42, match: [{ ...game,
    mercado_principal: { odds: [{ ...odd, od_id: "901", mk_id: "712" }] } }] }];
  const detail = { ...game, markets: { fulltime_result: { mk_id: 712, odds: [{ ...odd, id_od: 901 }] } } };
  const rules = { live_percent: 5, live_user: 1, live_markets: [{ reference: 712, percentage: 4 }], live_lock_above: 2.15 };
  const [gridEvent] = liveEventsFromPanel(grid, rules);
  const detailEvent = liveEventFromPanel(detail, rules)!;
  const input = { eventId: "555", marketId: "712", selectionId: "901" };
  assert.deepEqual(selectionForEvent(gridEvent, input), selectionForEvent(detailEvent, input));
  assert.equal(detailEvent.markets[0].options[0].odd, 2.15);
  const blocked = liveEventFromPanel(detail, { ...rules, live_block_markets: ["712"] })!;
  assert.equal(blocked.markets[0].options[0].odd, null);
  assert.equal(selectionForEvent(blocked, input), undefined);
  assert.equal(liveEventFromPanel(detail, { ...rules, live_block_events: ["999"] }), undefined);
});

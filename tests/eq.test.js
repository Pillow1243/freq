"use strict";

/**
 * Equalizer, loudness normalisation and the volume model.
 *
 * The behaviour that matters here is the one a user cannot see in a unit test:
 * which <audio> element owns playback. Effects may only be wired to #audio-fx,
 * because routing a stream that sends no CORS header through an AudioContext
 * mutes it. So every test asserts on the element that ended up with the src.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { makeDom, waitFor, click } = require("./helpers/dom.js");

const EQ_ON = { audioGraph: true, seed: { "freq-eq": "[6,4,0,0,-2,-3]" } };
/* Chrome rejects play() on a crossOrigin element whose resource has no CORS
   header, and fires `error` too — the helper can reproduce either. */
const EQ_ON_CORS_FAIL = {
  audioGraph: true,
  rejectFxPlay: true,
  seed: { "freq-eq": "[6,4,0,0,-2,-3]" },
};

/** Always tears the window down: a leaked jsdom window keeps timers alive and hangs the runner. */
function withDom(options, body) {
  return async function () {
    const ctx = makeDom("", options || {});
    try {
      await body(ctx.window, ctx.window.document, ctx);
    } finally {
      ctx.close();
    }
  };
}

function listReady(doc) {
  return () => doc.querySelectorAll("#cards [data-play]").length >= 3;
}

function moveRange(el, value, window) {
  el.value = String(value);
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
}

test(
  "no effect armed: playback stays on the graph-free element",
  withDom({ audioGraph: true }, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")), "plain element loads");

    assert.match(String(doc.getElementById("audio").src), /stream\.example\/one$/);
    assert.equal(doc.getElementById("audio-fx").getAttribute("src"), null, "fx element stays idle");
    assert.ok(
      !window.__fxLog.calls.some((c) => c.indexOf("source:") === 0),
      "no AudioContext graph is built when nothing is armed"
    );
  })
);

test(
  "EQ armed: the cross-origin element drives the graph",
  withDom(EQ_ON, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio-fx").getAttribute("src")), "fx element loads");

    assert.match(String(doc.getElementById("audio-fx").src), /stream\.example\/one$/);
    assert.equal(doc.getElementById("audio").getAttribute("src"), null, "plain element must not also load");
    assert.ok(window.__fxLog.calls.indexOf("source:audio-fx") >= 0, "the graph taps #audio-fx only");
    const biquads = window.__fxLog.nodes.filter((n) => n.indexOf("biquad->") === 0).length;
    assert.ok(biquads >= 5, "bands chain into each other, saw " + biquads);
    assert.ok(window.__fxLog.nodes.indexOf("comp->gain") >= 0, "compressor feeds the master gain");
    assert.ok(window.__fxLog.calls.indexOf("biquad.gain.setTargetAtTime=6") >= 0, "first band carries +6 dB");
    assert.equal(doc.getElementById("eq-status").dataset.state, "on");
  })
);

test(
  "a stream without CORS headers falls back instead of going silent",
  withDom(EQ_ON_CORS_FAIL, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")), "replays on the plain element");

    assert.match(String(doc.getElementById("audio").src), /stream\.example\/one$/, "same station, quiet path");
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-nocors")), ["uuid-1"]);
    assert.match(doc.getElementById("toast-msg").textContent, /CORS/);

    /* The ban is per stream, so another station still gets the equalizer. */
    click(window, doc.querySelector('#cards [data-play="uuid-3"]'));
    assert.ok(await waitFor(() => /three$/.test(String(doc.getElementById("audio-fx").src || ""))), "next station keeps the EQ");

    /* Once sound is confirmed the same station is no longer treated as blocked. */
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-nocors")), ["uuid-1"], "blacklist unchanged");
  })
);

test(
  "master trim and per-station trim compose into the element volume",
  withDom({ seed: { "freq-vol": "0.5", "freq-master": "1.25" } }, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    assert.ok(await waitFor(() => doc.getElementById("vol-n").textContent === "50"), "volume restored");
    assert.equal(doc.getElementById("audio").volume, 0.625, "0.5 x 1.25");

    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")), "playing");

    /* The slider carries the trim as a percentage: 128 means +28% for this station only. */
    moveRange(doc.getElementById("eq-trim"), 128, window);
    assert.ok(await waitFor(() => doc.getElementById("audio").volume === 0.8), "trim applied");
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-trims")), { "uuid-1": 1.28 });
    assert.equal(doc.getElementById("eq-trim-n").textContent, "128%");
  })
);

test(
  "a station trim does not leak to other stations",
  withDom({ seed: { "freq-trims": '{"uuid-1":1.4}', "freq-vol": "0.5" } }, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    assert.equal(doc.getElementById("audio").volume, 0.5, "no station playing yet, so no trim");
    click(window, doc.querySelector('#cards [data-play="uuid-2"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")));
    assert.equal(doc.getElementById("audio").volume, 0.5, "uuid-2 is untrimmed");
  })
);

test(
  "the dialog exposes every band, a preset row and honest status copy",
  withDom(EQ_ON, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.getElementById("eq-btn"));
    assert.equal(doc.getElementById("eq").hidden, false);

    const bands = doc.querySelectorAll("#eq-grid [data-eqband]");
    assert.equal(bands.length, 6);
    assert.equal(doc.getElementById("eq-b-sub").value, "6");
    assert.match(bands[5].getAttribute("aria-valuetext"), /-3 dB/);

    moveRange(doc.getElementById("eq-b-sub"), 9, window);
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-eq")), [9, 4, 0, 0, -2, -3]);

    const presets = doc.querySelectorAll("#eq-presets [data-eqpreset]");
    assert.ok(presets.length >= 6, "preset chips render");
    click(window, doc.querySelector('#eq-presets [data-eqpreset="vocal"]'));
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-eq")), [-4, -2, 2, 5, 4, 1]);
    assert.equal(doc.querySelector('#eq-presets [data-eqpreset="vocal"]').getAttribute("aria-pressed"), "true");

    click(window, doc.getElementById("eq-normalize"));
    assert.equal(window.localStorage.getItem("freq-normalize"), "1");
    assert.ok(
      window.__fxLog.calls.indexOf("comp.threshold.setTargetAtTime=-21.2") >= 0 &&
        window.__fxLog.calls.indexOf("comp.ratio.setTargetAtTime=9.7") >= 0,
      "normalisation drives the compressor: " + JSON.stringify(window.__fxLog.calls.slice(0, 12))
    );

    const before = window.__fxLog.calls.length;
    click(window, doc.getElementById("eq-normalize"));
    assert.ok(window.__fxLog.calls.slice(before).indexOf("comp.threshold.setTargetAtTime=0") >= 0,
      "switching normalisation off re-neutralises the compressor");

    click(window, doc.querySelector('#eq [data-act="eqreset"]'));
    assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-eq")), [0, 0, 0, 0, 0, 0]);
    assert.equal(doc.getElementById("eq-cors").hidden, true, "no CORS blacklist to clear here");
  })
);

test(
  "the keyboard opens the dialog and Escape leaves no stranded layer",
  withDom({}, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "e", bubbles: true }));
    assert.equal(doc.getElementById("eq").hidden, false, "E opens the equalizer");
    assert.equal(doc.getElementById("eq-btn").getAttribute("aria-expanded"), "true");

    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.equal(doc.getElementById("eq").hidden, true);
    assert.equal(doc.getElementById("eq-btn").getAttribute("aria-expanded"), "false");
  })
);

test(
  "browsers without WebAudio still get volume, and are told why not EQ",
  withDom({ seed: { "freq-eq": "[6,4,0,0,-2,-3]" } }, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")), "audio still plays");
    assert.match(String(doc.getElementById("audio").src), /stream\.example\/one$/);

    click(window, doc.getElementById("eq-btn"));
    assert.equal(doc.getElementById("eq-status").dataset.state, "unsupported");
    assert.match(doc.getElementById("eq-status").textContent, /WebAudio/);

    moveRange(doc.getElementById("eq-master"), 150, window);
    assert.equal(doc.getElementById("eq-master-n").textContent, "150%");
    assert.equal(doc.getElementById("audio").volume, 1, "0.85 x 1.5 clamped to 1");
  })
);

test(
  "arming the equalizer releases the element we leave",
  withDom({ audioGraph: true }, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-2"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio").getAttribute("src")), "starts on the plain path");

    /* Arm an effect, then move on: the old element must drop its stream. */
    click(window, doc.getElementById("eq-btn"));
    moveRange(doc.getElementById("eq-b-sub"), 4, window);
    click(window, doc.getElementById("eq-btn"));
    click(window, doc.querySelector('#cards [data-play="uuid-3"]'));
    assert.ok(await waitFor(() => !!doc.getElementById("audio-fx").getAttribute("src")), "now graphed");
    assert.equal(doc.getElementById("audio").getAttribute("src"), null, "the left element gives up its stream");
  })
);

test(
  "tweaking effects mid-stream never hands the stream to the other element",
  withDom(EQ_ON, async (window, doc) => {
    assert.ok(await waitFor(listReady(doc)), "stations render");
    click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
    assert.ok(await waitFor(() => doc.getElementById("player").classList.contains("on")), "playing");
    const url = String(doc.getElementById("audio-fx").src);

    /* The idle element fires pause/emptied when the path changes; honouring it
       would stop the music, which used to be the whole trick here. */
    doc.getElementById("audio").dispatchEvent(new window.Event("pause", { bubbles: true }));
    assert.ok(doc.getElementById("player").classList.contains("on"), "idle element cannot pause us");

    click(window, doc.getElementById("eq-normalize"));
    click(window, doc.getElementById("eq-normalize"));
    moveRange(doc.getElementById("eq-b-bass"), -5, window);

    assert.equal(String(doc.getElementById("audio-fx").src), url, "same element keeps the stream");
    assert.equal(doc.getElementById("audio").getAttribute("src"), null, "no re-handoff on setting changes");
    assert.ok(doc.getElementById("player").classList.contains("on"), "still playing");
  })
);

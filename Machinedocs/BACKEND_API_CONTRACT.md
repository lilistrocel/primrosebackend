# AbuEgg — Backend API Contract

Reverse-engineered from the machine at `D:\motong` (deviceId **3**, egg / 煎鸡蛋 machine).
Live backend: `http://kintsuji.motonbackend.top/swoft/api/motong/`

This documents exactly what `AbuEgg.exe` sends and what it requires back, so a
replacement backend can serve it without modifying the client.

---

## 1. Transport

| Property | Value |
|---|---|
| Base URL | from `appSettings["BaseUrl"]` in `AbuEgg.exe.config` |
| Method | **POST** for every endpoint |
| Content-Type | `application/json`, `charset=utf-8` |
| Auth | **none** — no token, no API key, no device secret |
| TLS | none; plain HTTP |
| Client | bundled `Lib\WebApiClient.dll` (no source), `HttpClient`-based |

### Trailing slash is load-bearing

`WebApiClient.ApiClient` sets `HttpClient.BaseAddress = new Uri(baseUrl)` and passes the
endpoint name as a **relative** URI with no leading slash. RFC 3986 resolution therefore
replaces the last path segment when the base lacks a trailing slash:

```
".../swoft/api/motong/" + "deviceOrderQueueList" -> ".../swoft/api/motong/deviceOrderQueueList"   OK
".../swoft/api/motong"  + "deviceOrderQueueList" -> ".../swoft/api/deviceOrderQueueList"          BROKEN
```

Verified against the live server: the broken form returns `302 -> /404`, body `{}`.
Since `HttpClient` follows redirects, a bad base URL surfaces as a JSON parse error
rather than an obvious 404.

---

## 2. Response envelope

```json
{ "code": 0, "msg": "Request successfully", "data": [] }
```

Client types (from `WebApiClient.dll`):

- `ApiModel<T>` -> `{ code: string, msg: string, data: T }`
- `ApiListModel<T>` -> `{ code: string, msg: string, data: List<T> }`

Rules the client enforces:

1. HTTP status must be 2xx (`IsSuccessStatusCode`), else the call returns `null`.
2. `code` is compared as a **string** to `"0"`. The live server emits the JSON
   **number** `0`; Newtonsoft coerces it. Emitting `"0"` as a string is equally valid.
3. Any `code != "0"` -> the client returns `null` and silently ignores the response.
4. `msg` is deserialized but **never read** by application code. Content is free-form.
5. `data` must be a **JSON array** for `PostListData` endpoints. An object there throws
   inside deserialization; the exception is swallowed and the call yields `null`.

There is no error channel: the live backend returns `code:0` even for failures — omitting
`deviceId` yields `{"code":0,"msg":"Undefined index: deviceId","data":[]}`. Returning a
real error code is safe, since the client just treats it as "no orders".

---

## 3. Endpoints actually called by AbuEgg.exe

Only **three**. (`getDeviceStock` and `orderQueue` exist in the sibling control app
`MexicanControl`, but its only call site is commented out — dead code.)

### 3.1 `deviceOrderQueueList` — order poll

- Call site: `Web/OrderCilent.cs:32` via `PostListData<OrderModel>`
- Cadence: every **3 s** (`MainWindow.xaml.cs:88`), paused while a status write is in flight
- Request:

```json
{"deviceId":"3"}
```

`deviceId` is a **string** (read from `App.config`, never converted to int).

- Response: `data` = array of orders (see §4).

### 3.2 `editDeviceOrderStatus` — status callback

- Call site: `Web/OrderCilent.cs:86` via `PostData<string>`
- Request:

```json
{"orderId":"2033","orderGoodsId":"2249","status":4}
```

`orderId` and `orderGoodsId` are **strings** (`.ToString()` applied); `status` is an **int**.
`orderGoodsId` is the **item's** `id` (from `typeList4[].id`), not the order's id.
The response body is ignored beyond the `code` check.

### 3.3 `saveDeviceMatter` — material / heartbeat

- Call site: `Web/OrderCilent.cs:91` via `PostListData<string>`
- Cadence: every **10 s** (`MainWindow.xaml.cs:113`), starting 5 s after launch
- Request (note the **double-encoded** JSON strings):

```json
{
  "matterStatusJson": "{\"EggMatter1\":1}",
  "deviceStatusJson": "{\"deviceStatus1\":1,\"deviceStatus2\":1,\"deviceStatus3\":1,\"deviceStatus4\":1,\"lhStatus\":1}",
  "deviceId": "3"
}
```

`EggMatter1` = 1 when egg liquid is detected, 0 otherwise. The `deviceStatusN` values are
hard-coded to 1 and never updated by this build.

**Caveat:** sent through `PostListData<string>`, so the client reads `data` as an **array
of strings**. Return `"data": []` — an object will throw.

---

## 4. Order / item model

Newtonsoft is case-insensitive; **unlisted JSON fields are silently dropped**.

### 4.1 `OrderModel` (`Model/OrderModel.cs`)

| Property | JSON source | Used? |
|---|---|---|
| `id` (string) | `id` (number, coerced) | parsed, unused |
| `num` (string) | `num` | parsed, unused |
| `status` (int) | `status` | parsed, unused |
| `orderNum` (string) | `orderNum` | **YES** — pickup code |
| `createdAt` (string) | `createdAt` | parsed, unused |
| `typeList4` (List) | `typeList4` | **YES** — the only bucket read |

**Ignored entirely:** `realPrice`, `created_at`, `language`, `statusName`,
`typeList1`, `typeList2`, `typeList3`.

> `typeListN` is a product-category bucket. On this backend: 1 = fried, 2 = coffee,
> 3 = ice cream, 4 = egg. **This machine reads only `typeList4`.** The numbering is NOT
> portable across deployments — the sibling AbuFried reads `typeList2`.

**Constraint:** `orderNum` must be at least **6 characters**. `OrderCilent.cs:52` calls
`orderNum.Substring(len-6, 6)` with no guard to derive the 6-digit pickup code, which is
later read aloud digit by digit.

### 4.2 `EggDataModel` (item inside `typeList4`)

| Property | JSON source | Used? |
|---|---|---|
| `Id` (int) | `id` | **YES** — sent back as `orderGoodsId` |
| `OrderId` (string) | `orderId` | **YES** — sent back as `orderId` |
| `JsonCodeVal` (string) | `jsonCodeVal` | **YES** — see §5 |
| `Status` (int) | `status` | parsed, then overwritten locally |
| `goodsNameEn` (string) | `goodsNameEn` | parsed, unused |
| `OrderGoodId` (int) | *(no matching JSON field)* | always 0, unused |
| `Guid` | client-generated | — |
| `productPickUpCode` | derived from `orderNum` | — |
| `eggDataParameter` | parsed from `jsonCodeVal` | — |
| `MakeStatus` (int) | **client-side only**, defaults to 1 | drives dispatch |

**Ignored:** `deviceGoodsId`, `type`, `goodsId`, `goodsName`, `goodsNameOt`, `goodsImg`,
`goodsOptionName(En|Ot)`, `language`, `price`, `rePrice`, `matterCodes`, `num`,
`totalPrice`, `lhImgPath`, `path`, `goodsPath`, `statusName`.

> **Do NOT emit a `makeStatus` field.** It binds to the client-side `MakeStatus` and
> overrides the default of 1, making the order invisible to the dispatcher
> (`RobotLMsg.cs:64` selects `MakeStatus == 1`). Same risk for `guid` and
> `productPickUpCode`.

---

## 5. `jsonCodeVal` — the behavior parameter

A **string containing a JSON array of single-key objects** (double-encoded), parsed at
`OrderCilent.cs:56` as `List<Dictionary<string,string>>`:

```json
"jsonCodeVal": "[{\"classCode\":\"003001\"}]"
```

### Keys parsed on THIS machine

| Key | Handling |
|---|---|
| `classCode` | the **only** key read. Must equal `"003001"`. |

That is the entire parameter surface. Unlike the sibling AbuFried machine — which reads
`classCode`, `firedType` and `foodType` — this machine has **one product and no
parameterization**. `foodType`, `firedType`, `noodleType` and `noodleSpecifications` do
not appear anywhere in this codebase.

### No `Convert.ToByte` on order data

`Convert.ToByte` appears only in the serial layer (`IODoSerialPort.cs:115,171`,
`IOSerialPort.cs:102`) as `Convert.ToByte(item, 16)` — hex parsing of RS-232 frames,
unrelated to the API. **No order field is converted to a byte**, so the sibling's
"integer strings 0-255" convention does NOT apply here.

### Parsing constraints

- All values must be **scalars**. A nested object or array makes
  `DeserializeObject<List<Dictionary<string,string>>>` throw.
- If several objects carry `classCode`, the **last one wins** (the loop overwrites).
- An empty array `"[]"` leaves `classCode` null -> treated as non-egg (see below).

### The `classCode` guard aborts the whole poll

`OrderCilent.cs:75` uses `return`, not `continue`:

```csharp
if (eggData.eggDataParameter.classCode != "003001")
    return;          // abandons the ENTIRE poll cycle, not just this item
```

**Therefore: only ever place `003001` items in `typeList4` for this device.** A single
foreign item aborts processing of every order in that response, including valid ones
queued behind it.

---

## 6. Status codes

### `EggStatusType` (`Model/EnumClass.cs`) — values sent to the backend

| Name | Value | Meaning |
|---|---|---|
| `WaitToMake` | 3 | 待制作 — queued (what the backend serves) |
| `Making` | 4 | 制作中 — written when the robot starts |
| `Completed` | 5 | 已完成 — written when the egg is done |

Full server-side scale (per the `EggDataModel.Status` comment):
`1` unpaid, `2` paid, `3` to-make, `4` making, `5` completed.
The live backend serves queued items as `status:3` / `statusName:"Queuing"`.

### `MakeStatus` — client-side only, never transmitted

| Value | Meaning |
|---|---|
| 1 | queued locally (default on arrival) |
| 2 | in progress |
| 3 | finished |

---

## 7. Runtime behavior a backend must accommodate

**Single order in flight.** `OrderCilent.cs:44` stops ingesting if any item has
`MakeStatus == 1 || 2`. The machine accepts exactly one unfinished order at a time.

**Dedupe by item id.** `OrderCilent.cs:40` skips items whose `Id` is already in
`EggDataList`. That list is **never pruned**, so a completed item is never re-made even if
the backend keeps returning it. (It also grows unbounded — a slow memory leak.)

**Polling pauses during status writes.** `EggMake` sets `OrderNotFind = true` around each
`SaveOrderStatus` call and the poll loop skips while it is set, so `editDeviceOrderStatus`
never races the queue poll.

**Status writes are fire-and-forget.** `SaveOrderStatus` ignores the response entirely. A
failed status write is never retried and the machine proceeds regardless. If the backend
misses a `status:5`, the order stays "Making" server-side forever.

**Idempotency.** Because dedupe is client-side and in-memory, an app restart re-fetches any
order the backend still reports as `status:3` and **re-makes it**. The backend must flip
status away from 3 once the `Making` callback arrives.

### Make sequence (for timing expectations)

`EggMake.MakeEgg()` — status 4 sent at the start, status 5 at the end:

1. `SaveOrderStatus(Making = 4)`
2. wait for robot origin position (`RobotYD_Sel`)
3. induction cooker heat cycle (`Cook_start` / `Cook_end` over serial DO)
4. `RobotStart_UP` -> wait for heat complete -> `RobotStart_Down`
5. knife up/down, then wait for bowl in place (`RobotFangWan_Sel`)
6. `RobotMakeEgg_Up` -> wait origin -> `RobotMakeEgg_Down`, second cook cycle
7. voice: `"Code d d d d d d has done"` (6 digits of the pickup code)
8. `SaveOrderStatus(Completed = 5)`

Several steps are unbounded `while(true)` sensor waits, so elapsed time between status 4
and status 5 is **not bounded** — do not time orders out aggressively server-side.

Pre-flight gates (`RobotLMsg.cs:72-100`) block indefinitely with voice prompts until the
bowl, spoon and shovel are in place. The egg-liquid check is currently commented out.

---

## 8. deviceId source

`App.config` / `AbuEgg.exe.config`:

```xml
<add key="DeviceId" value="3"/>
<add key="BaseUrl" value="http://kintsuji.motonbackend.top/swoft/api/motong/"/>
```

Read at `MainWindow.xaml.cs:26` into `IPorPortInfo.Instance.DeviceId` (a **string**) and
sent verbatim. Changing the backend = edit `AbuEgg.exe.config` + restart, no rebuild.

Other keys (not API-related): `RobotIP` 192.168.10.10, `RobotPort` 502 (Modbus/TCP, JAKA
arm), `DIName` com1, `DOName` com2, `SocketHost` 192.168.10.3, `SocketPort` 8885.

---

## 9. Minimal viable response

To make this machine produce one egg, `deviceOrderQueueList` must return:

```json
{
  "code": 0,
  "msg": "Request successfully",
  "data": [
    {
      "id": 2033,
      "num": 1,
      "status": 3,
      "orderNum": "2026081253100995",
      "createdAt": "2026-08-12 08:44:05",
      "typeList4": [
        {
          "id": 2249,
          "orderId": 2033,
          "status": 3,
          "goodsNameEn": "Fried Egg",
          "jsonCodeVal": "[{\"classCode\":\"003001\"}]"
        }
      ],
      "typeList1": [],
      "typeList2": [],
      "typeList3": []
    }
  ]
}
```

Then accept two callbacks, replying `{"code":0,"msg":"ok","data":""}`:

```json
{"orderId":"2033","orderGoodsId":"2249","status":4}
{"orderId":"2033","orderGoodsId":"2249","status":5}
```

And accept the 10-second `saveDeviceMatter` heartbeat, replying `{"code":0,"msg":"ok","data":[]}`.

### Checklist

- [ ] `BaseUrl` ends with `/`
- [ ] `code` is `0` (number or `"0"`)
- [ ] `data` is an **array** for `deviceOrderQueueList` and `saveDeviceMatter`
- [ ] `orderNum` is >= 6 characters
- [ ] `jsonCodeVal` is a **double-encoded** JSON array containing `classCode` = `003001`
- [ ] items are in `typeList4`, and `typeList4` contains **only** `003001` items
- [ ] no `makeStatus` / `guid` / `productPickUpCode` fields emitted
- [ ] the order stops being returned (or leaves `status:3`) once the `status:4` callback arrives

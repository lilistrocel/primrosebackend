# Quick Network Optimization - README

## 🚀 Fast Startup for Local Development

Your system has been optimized for maximum speed and offline operation.

### Default Configuration (Recommended)

**.env file** (already configured):
```bash
NODE_OPTIONS="--dns-result-order=ipv4first"
ENABLE_TUNNEL=false
BIND_LOCAL_ONLY=false
LOCAL_IP=192.168.10.2
```

This configuration:
- ✅ Works offline
- ✅ No IPv6 delays
- ✅ No DNS lookups
- ✅ Fast startup (~8 seconds)
- ✅ Coffee machine can connect

### Usage

**For daily development:**
```bash
npm run dev:cleaned
```

**That's it!** System will start quickly with or without internet.

### When You Need Internet Tunnel

Only if you need external access via tunnel:

1. Edit `.env`:
   ```bash
   ENABLE_TUNNEL=true
   ```

2. Start system:
   ```bash
   npm run dev:cleaned
   ```

### Verification

After starting, you should see:
- ✅ No IPv6 warnings (no "警告: TCP connect to (::1")
- ✅ Fast port checks (< 1 second each)
- ✅ Total startup < 10 seconds

### Troubleshooting

**Q: Coffee machine can't connect?**  
A: Check `.env` has `BIND_LOCAL_ONLY=false`

**Q: Still seeing IPv6 warnings?**  
A: Restart terminal/PowerShell after `.env` changes

**Q: Slow startup?**  
A: Verify `.env` has `ENABLE_TUNNEL=false`

---

**Full details:** See `NETWORK_OPTIMIZATION.md`


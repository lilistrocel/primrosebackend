# Network Configuration Guide

This guide explains how to configure IP addresses for the coffee machine system to work on different networks.

## Quick Setup

### 🚀 Easy Method (Recommended)

```bash
# Check current configuration
npm run network:config

# Update to new IP address
npm run network:update 192.168.1.100

# Restart services
npm start                    # Backend
cd frontend && npm start     # Frontend
```

### ⚙️ Manual Method

1. **Edit root `.env` file**:
   ```env
   LOCAL_IP=192.168.1.100
   FRONTEND_PORT=3001
   BACKEND_PORT=3000
   MOCK_PORT=3002
   ```

2. **Edit `frontend/.env` file**:
   ```env
   REACT_APP_API_BASE_URL=http://192.168.1.100:3000
   ```

3. **Restart both services**

## File Locations

### Root `.env` (Main Configuration)
```
LOCAL_IP=192.168.10.2           # Your server's IP address
FRONTEND_PORT=3001              # Frontend kiosk port
BACKEND_PORT=3000               # Backend API port  
MOCK_PORT=3002                  # Mock machine dashboard port
REACT_APP_API_BASE_URL=http://192.168.10.2:3000
```

### `frontend/.env` (Frontend Configuration)
```
HOST=0.0.0.0                    # Allow external connections
PORT=3001                       # Frontend port
REACT_APP_API_BASE_URL=http://192.168.10.2:3000  # Backend URL
```

## Network Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Coffee        │    │   Backend       │    │   Frontend      │
│   Machine       │───▶│   API Server    │◀───│   Kiosk         │
│   192.168.10.6  │    │   192.168.10.2  │    │   192.168.10.2  │
│   (Polls API)   │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Access URLs

After configuration, your services will be available at:

- **Backend API**: `http://YOUR_IP:3000`
- **Frontend Kiosk**: `http://YOUR_IP:3001`
- **Kiosk Orders**: `http://YOUR_IP:3001/kiosk`
- **Admin Interface**: `http://YOUR_IP:3001/items`
- **Mock Machine Dashboard**: `http://YOUR_IP:3002`

## Common Scenarios

### Scenario 1: Home Network (192.168.1.x)
```bash
npm run network:update 192.168.1.100
```

### Scenario 2: Office Network (10.0.0.x)
```bash
npm run network:update 10.0.0.50
```

### Scenario 3: Different Subnet (172.16.x.x)
```bash
npm run network:update 172.16.1.200
```

## CORS Configuration

The system automatically configures CORS for:
- `localhost` variants (development)
- `127.0.0.1` variants (local testing)
- Your configured IP address (external access)

All ports (3000, 3001, 3002) are included for each IP.

## Troubleshooting

### Problem: "Cannot access from iPad/external device"
**Solution**: 
1. Check if IP is correct: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Update configuration: `npm run network:update YOUR_ACTUAL_IP`
3. Restart services
4. Test: `http://YOUR_IP:3001/kiosk`

### Problem: "CORS errors in browser console"
**Solution**:
1. Verify backend is running: `http://YOUR_IP:3000/api/motong/deviceOrderQueueList`
2. Check CORS origins in backend logs
3. Restart backend after IP changes

### Problem: "Products not loading in kiosk"
**Solution**:
1. Check `frontend/.env` has correct `REACT_APP_API_BASE_URL`
2. Verify backend API responds: `http://YOUR_IP:3000/api/motong/products`
3. Check browser network tab for failed requests

### Problem: "Coffee machine not polling"
**Solution**:
1. Coffee machine is configured to poll specific IP
2. Backend must run on the IP the machine expects
3. Check machine's network configuration

## Network Discovery

### Find Your Current IP Address

**Windows**:
```cmd
ipconfig | findstr "IPv4"
```

**Linux/macOS**:
```bash
ip addr show | grep "inet "
hostname -I
```

**All Platforms**:
```bash
npm run network:config  # Shows current configuration
```

## Development vs Production

### Development (Local testing)
- Use `localhost` or `127.0.0.1`
- All services on same machine
- Easy debugging and testing

### Production (Network deployment)
- Use actual network IP address
- External devices can connect
- Coffee machine integration
- iPad/tablet kiosk access

## Security Considerations

1. **Firewall**: Ensure ports 3000-3002 are open
2. **Network**: Only allow trusted devices on network
3. **HTTPS**: Consider SSL certificates for production
4. **Access Control**: Limit admin interface access

## Advanced Configuration

### Custom Ports
Edit `.env` file:
```env
LOCAL_IP=192.168.1.100
FRONTEND_PORT=8001
BACKEND_PORT=8000
MOCK_PORT=8002
```

### Multiple Network Interfaces
The system automatically detects and configures all network interfaces.

### Load Balancing
For high-availability setups, configure multiple backend instances with different ports.

## Monitoring

### Check Services Status
```bash
# Backend health
curl http://YOUR_IP:3000/api/motong/deviceOrderQueueList

# Frontend accessibility  
curl http://YOUR_IP:3001

# Mock machine dashboard
curl http://YOUR_IP:3002
```

### View Network Configuration
```bash
npm run network:config
```

### Monitor Network Traffic
```bash
# Windows
netstat -an | findstr :3000

# Linux/macOS
netstat -tuln | grep 3000
```

## Support

If you encounter issues:

1. **Check network connectivity**: Can you ping the IP?
2. **Verify configuration**: Run `npm run network:config`
3. **Test services individually**: Backend first, then frontend
4. **Check logs**: Look for CORS, connection, or binding errors
5. **Restart services**: Stop and start backend and frontend

For additional help, check the main project documentation or raise an issue.

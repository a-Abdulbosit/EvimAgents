// Global variables
let allShops = []
let currentPage = 0
const itemsPerPage = 6
const expandedDescriptions = new Set()
let selectedShopId = null
let map = null
let placemarks = []
let isPanelOpen = false
let lastDataHash = null

// Auto-update interval (1 second)
const AUTO_UPDATE_INTERVAL = 1000
let updateInterval = null

// Generate hash for data comparison
function generateDataHash(data) {
    return JSON.stringify(data)
        .split("")
        .reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0)
            return a & a
        }, 0)
}

// Show update notification
function showUpdateNotification() {
    const notification = document.getElementById("updateNotification")
    notification.classList.add("show")
    setTimeout(() => {
        notification.classList.remove("show")
    }, 2000)
}

// Panel toggle functions
function togglePanel() {
    if (isPanelOpen) {
        closePanel()
    } else {
        openPanel()
    }
}

function openPanel() {
    const sidebar = document.getElementById("sidebar")
    const toggle = document.getElementById("panelToggle")

    sidebar.classList.add("open")
    toggle.classList.add("panel-open")
    toggle.innerHTML = "📊"
    isPanelOpen = true
}

function closePanel() {
    const sidebar = document.getElementById("sidebar")
    const toggle = document.getElementById("panelToggle")

    sidebar.classList.remove("open")
    toggle.classList.remove("panel-open")
    toggle.innerHTML = "📊"
    isPanelOpen = false
}

// Utility functions
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000
    const toRad = (x) => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function getStatusInfo(status) {
    switch (status) {
        case 0:
            return { text: "Pending", class: "pending", icon: "🕓" }
        case 1:
            return { text: "Active", class: "active", icon: "✅" }
        case 2:
            return { text: "Inactive", class: "inactive", icon: "❌" }
        default:
            return { text: "Unknown", class: "review", icon: "❓" }
    }
}

function createCustomIcon(iconColor, iconSize, displayText) {
    const radius = iconSize[0] / 2 - 3
    const cx = iconSize[0] / 2
    const cy = iconSize[1] / 2

    const svgContent = `
        <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 ${iconSize[0]} ${iconSize[1]}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
                </filter>
            </defs>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${iconColor}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
            <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
                  fill="white" font-family="Arial, sans-serif" font-size="${iconSize[0] / 2.2}" font-weight="bold">
                ${displayText}
            </text>
        </svg>
    `

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
}

// Data conversion functions
function convertLocationDataToShops(locations) {
    return locations.map((location, index) => ({
        id: `shop-${index + 1}`,
        name: location.marketName,
        address:
            location.latitude != null && location.longitude != null
                ? `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                : "Coordinates missing",
        description: location.notes || `${location.marketName} - Partner retail location`,
        agent: location.agentName,
        phone: location.marketNumber,
        createdAt: location.createdAt,
        status: location.status === 1 ? "active" : location.status === 0 ? "pending" : "inactive",
        notes: location.notes,
        latitude: location.latitude,
        longitude: location.longitude,
        originalStatus: location.status,
    }))
}

// Load shop data with automatic updates
async function loadShopData(showNotification = false) {
    try {
        const timestamp = Date.now()
        const url = `locations.json?v=${timestamp}`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const locations = await response.json()
        const newDataHash = generateDataHash(locations)

        // Check if data has changed
        const dataChanged = lastDataHash !== null && lastDataHash !== newDataHash

        if (dataChanged || allShops.length === 0) {
            allShops = convertLocationDataToShops(locations)
            lastDataHash = newDataHash

            updateUI()
            updateMap()

            // Update popup if it's open
            const popup = document.getElementById("popupOverlay")
            if (popup.classList.contains("active")) {
                renderShops()
            }

            // Show notification for data changes (not initial load)
            if (showNotification && dataChanged) {
                showUpdateNotification()
            }

            console.log(`${dataChanged ? "Updated" : "Loaded"} ${allShops.length} shops from locations.json`)
        }
    } catch (error) {
        console.error("Error loading locations:", error)
    }
}

// Update UI with shop data
function updateUI() {
    const shopCount = allShops.length
    const activeCount = allShops.filter((s) => s.status === "active").length
    const pendingCount = allShops.filter((s) => s.status === "pending").length
    const inactiveCount = allShops.filter((s) => s.status === "inactive").length

    // Update sidebar
    document.getElementById("sidebarSubtitle").textContent = `${shopCount} shops in network`
    document.getElementById("activeCount").textContent = activeCount
    document.getElementById("pendingCount").textContent = pendingCount
    document.getElementById("inactiveCount").textContent = inactiveCount
    document.getElementById("popupSubtitle").textContent = `${shopCount} shops found`

    // Show content, hide loading
    document.getElementById("sidebarLoading").style.display = "none"
    document.getElementById("sidebarContent").style.display = "block"

    // Update shops list
    updateShopsList()
}

// Update shops list in sidebar
function updateShopsList() {
    const shopsList = document.getElementById("shopsList")
    const displayShops = allShops.slice(0, 8) // Show first 8 shops in sidebar

    shopsList.innerHTML = displayShops
        .map(
            (shop) => `
        <div class="shop-item ${selectedShopId === shop.id ? "selected" : ""}" onclick="selectShop('${shop.id}')">
            <div class="shop-item-header">
                <div class="shop-item-name">${shop.name}</div>
                <div class="shop-item-status ${shop.status}">${shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}</div>
            </div>
            <div class="shop-item-details">
                Agent: ${shop.agent}<br>
                Phone: ${shop.phone}
            </div>
        </div>
    `,
        )
        .join("")
}

// Select shop and center map
function selectShop(shopId) {
    selectedShopId = shopId
    const shop = allShops.find((s) => s.id === shopId)

    if (shop && map) {
        map.setCenter([shop.latitude, shop.longitude], 15, {
            duration: 400,
            timingFunction: "ease-out",
        })
    }

    updateShopsList()
}

function updateMap() {
    if (!map) return

    // Clear existing placemarks
    placemarks.forEach((placemark) => {
        map.geoObjects.remove(placemark)
    })
    placemarks = []

    // Group shops by proximity
    const groups = []
    allShops.forEach((shop) => {
        const group = groups.find((g) => getDistance(g[0].latitude, g[0].longitude, shop.latitude, shop.longitude) <= 50)
        if (group) group.push(shop)
        else groups.push([shop])
    })

    groups.forEach((group) => {
        const lat = group[0].latitude
        const lon = group[0].longitude

        // Create balloon content
        const storeCardsHtml = group
            .map((shop, index) => {
                const statusInfo = getStatusInfo(shop.originalStatus)
                const yandexGoUrl = `https://3.redirect.appmetrica.yandex.com/route?end-lat=${shop.latitude}&end-lon=${shop.longitude}&appmetrica_tracking_id=1178268795219780156`

                return `
                <div class="store-card">
                    <div class="store-header">
                        <div class="store-name">${shop.name}</div>
                    </div>
                    <div class="store-details">
                        <div class="detail-row">
                            <div class="detail-icon-wrapper agent">
                                <span class="detail-icon">👤</span>
                            </div>
                            <div class="detail-content">
                                <span class="detail-label">Agent</span>
                                <span class="detail-value">${shop.agent}</span>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-icon-wrapper phone">
                                <span class="detail-icon">📞</span>
                            </div>
                            <div class="detail-content">
                                <span class="detail-label">Phone</span>
                                <span class="detail-value">
                                    <a href="tel:${shop.phone}" style="color: #2563eb; text-decoration: none;">
                                        ${shop.phone}
                                    </a>
                                </span>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-icon-wrapper date">
                                <span class="detail-icon">📅</span>
                            </div>
                            <div class="detail-content">
                                <span class="detail-label">Added</span>
                                <span class="detail-value">${new Date(shop.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}</span>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-icon-wrapper status">
                                <span class="detail-icon">${statusInfo.icon}</span>
                            </div>
                            <div class="detail-content">
                                <span class="detail-label">Status</span>
                                <span class="detail-value">
                                    <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                                </span>
                            </div>
                        </div>
                        ${shop.notes
                        ? `
                            <div class="detail-row">
                                <div class="detail-icon-wrapper notes">
                                    <span class="detail-icon">📝</span>
                                </div>
                                <div class="detail-content">
                                    <span class="detail-label">Notes</span>
                                    <span class="detail-value">${shop.notes}</span>
                                </div>
                            </div>
                        `
                        : ""
                    }
                        <a href="${yandexGoUrl}" target="_blank" class="route-button">
                            🚗 Build Route
                        </a>
                    </div>
                </div>
            `
            })
            .join("")

        const content = `
            <div class="modern-balloon">
                <div class="balloon-header">
                    <h3 class="balloon-main-title">
                        ${group.length > 1 ? `Shop Group` : "Partner Shop"}
                    </h3>
                    ${group.length > 1 ? `<p class="balloon-subtitle">${group.length} shops in this area</p>` : ""}
                </div>
                <div class="balloon-content">
                    ${storeCardsHtml}
                </div>
            </div>
        `

        const getIconColor = (status) => {
            switch (status) {
                case 0:
                    return "#f59e0b" // pending - yellow
                case 1:
                    return "#059669" // active - green
                case 2:
                    return "#dc2626" // inactive - red
                default:
                    return "#6b7280" // unknown - gray
            }
        }

        const iconColor = group.length === 1 ? getIconColor(group[0].originalStatus) : "#3b82f6"
        const iconSize = group.length > 1 ? [36, 36] : [28, 28]
        const iconOffset = group.length > 1 ? [-18, -36] : [-14, -28]
        const displayText = group.length > 1 ? group.length.toString() : "M"

        const placemark = new ymaps.Placemark(
            [lat, lon],
            {
                balloonContent: content,
                hintContent: group.length > 1 ? `Group of ${group.length} shops` : group[0].name,
            },
            {
                iconLayout: "default#image",
                iconImageHref: createCustomIcon(iconColor, iconSize, displayText),
                iconImageSize: iconSize,
                iconImageOffset: iconOffset,
                hideIconOnBalloonOpen: false,
                balloonAutoPan: true,
                balloonOffset: [0, -10],
            },
        )

        placemark.events.add("click", (e) => {
            e.stopPropagation()
            const coords = placemark.geometry.getCoordinates()
            map
                .setCenter(coords, Math.max(map.getZoom(), 15), {
                    duration: 400,
                    timingFunction: "ease-out",
                })
                .then(() => {
                    placemark.balloon.open()
                })
        })

        map.geoObjects.add(placemark)
        placemarks.push(placemark)
    })
}

// Initialize map
function initMap() {
    ymaps.ready(() => {
        map = new ymaps.Map(
            "map",
            {
                center: [41.31, 69.28],
                zoom: 11,
                controls: ["zoomControl", "fullscreenControl", "typeSelector"],
                suppressMapOpenBlock: true,
                yandexMapDisablePoiInteractivity: true,
            },
            {
                suppressMapOpenBlock: true,
                avoidFractionalZoom: false,
                restrictMapArea: false,
            },
        )

        map.controls.get("zoomControl").options.set({
            size: "large",
            position: { right: 10, top: 50 },
            adjustMapMargin: false,
        })

        map.controls.get("fullscreenControl").options.set({
            position: { right: 10, top: 110 },
            adjustMapMargin: false,
        })

        map.events.add("click", (e) => {
            map.balloon.close()
        })

        // Load initial data
        loadShopData()

        // Start auto-update
        startAutoUpdate()
    })
}

// Start automatic updates
function startAutoUpdate() {
    updateInterval = setInterval(() => {
        loadShopData(true)
    }, AUTO_UPDATE_INTERVAL)
}

// Stop automatic updates
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval)
        updateInterval = null
    }
}

// Popup functions
function truncateText(text, maxLength = 120) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
}

function toggleDescription(shopId) {
    if (expandedDescriptions.has(shopId)) {
        expandedDescriptions.delete(shopId)
    } else {
        expandedDescriptions.add(shopId)
    }
    renderShops()
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

function createShopCard(shop) {
    const isExpanded = expandedDescriptions.has(shop.id)
    const description = isExpanded ? shop.description : truncateText(shop.description)
    const needsExpansion = shop.description.length > 120

    return `
        <div class="shop-card">
            <div class="shop-header">
                <h3 class="shop-name">${shop.name}</h3>
                <span class="status-badge ${shop.status}">${shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}</span>
            </div>
            
            <div class="shop-details">
                <div class="detail-row">
                    <div class="detail-icon address">📍</div>
                    <div class="detail-content">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">${shop.address}</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon agent">👤</div>
                    <div class="detail-content">
                        <div class="detail-label">Agent</div>
                        <div class="detail-value">${shop.agent}</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon phone">📞</div>
                    <div class="detail-content">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">
                            <a href="tel:${shop.phone}" class="phone-link">${shop.phone}</a>
                        </div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon notes">📝</div>
                    <div class="detail-content">
                        <div class="detail-label">Description</div>
                        <div class="detail-value description-text">
                            ${description}
                            ${needsExpansion
            ? `
                                <button class="expand-btn" onclick="toggleDescription('${shop.id}')">
                                    ${isExpanded ? "Show less" : "Show more"}
                                </button>
                            `
            : ""
        }
                        </div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon date">📅</div>
                    <div class="detail-content">
                        <div class="detail-label">Added</div>
                        <div class="detail-value">${formatDate(shop.createdAt)}</div>
                    </div>
                </div>
                
                ${shop.notes && shop.notes !== shop.description
            ? `
                    <div class="notes-section">
                        <div class="detail-label">Notes</div>
                        <div class="detail-value description-text">${shop.notes}</div>
                    </div>
                `
            : ""
        }
            </div>
            
            <button class="view-details-btn" onclick="viewShopDetails('${shop.id}')">
                View on Map
            </button>
        </div>
    `
}

function renderShops() {
    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentShops = allShops.slice(startIndex, endIndex)

    const shopsGrid = document.getElementById("shopsGrid")
    shopsGrid.innerHTML = currentShops.map((shop) => createShopCard(shop)).join("")

    updatePagination()
}

function updatePagination() {
    const totalPages = Math.ceil(allShops.length / itemsPerPage)
    const startIndex = currentPage * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, allShops.length)

    document.getElementById("paginationInfo").textContent =
        `Showing ${startIndex + 1} to ${endIndex} of ${allShops.length} shops`

    const pagination = document.getElementById("pagination")
    pagination.style.display = totalPages > 1 ? "flex" : "none"

    if (totalPages <= 1) return

    const controls = document.getElementById("paginationControls")
    let html = ""

    html += `<button class="pagination-btn" ${currentPage === 0 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">‹</button>`

    const maxVisiblePages = 5
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i + 1}</button>`
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += '<div class="pagination-ellipsis">...</div>'
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`
    }

    html += `<button class="pagination-btn" ${currentPage === totalPages - 1 ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">›</button>`

    controls.innerHTML = html
}

function goToPage(page) {
    const totalPages = Math.ceil(allShops.length / itemsPerPage)
    if (page >= 0 && page < totalPages) {
        currentPage = page
        renderShops()

        // Scroll to top of popup content when changing pages
        const popupContent = document.getElementById("popupOverlay").querySelector(".popup-content")
        if (popupContent) {
            popupContent.scrollTop = 0
        }
    }
}

function openPopup() {
    if (allShops.length === 0) return

    currentPage = 0
    expandedDescriptions.clear()
    renderShops()

    const overlay = document.getElementById("popupOverlay")
    overlay.classList.add("active")
    document.body.style.overflow = "hidden"

    // Ensure popup content starts from the top
    setTimeout(() => {
        const popupContent = overlay.querySelector(".popup-content")
        if (popupContent) {
            popupContent.scrollTop = 0
        }
    }, 100)
}

function closePopup() {
    const overlay = document.getElementById("popupOverlay")
    overlay.classList.remove("active")
    document.body.style.overflow = "unset"
}

function closePopupOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closePopup()
    }
}

function viewShopDetails(shopId) {
    const shop = allShops.find((s) => s.id === shopId)
    if (shop && map) {
        closePopup()
        selectShop(shopId)
        if (!isPanelOpen) {
            openPanel()
        }
    }
}

// Keyboard event handlers
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (document.getElementById("popupOverlay").classList.contains("active")) {
            closePopup()
        } else if (isPanelOpen) {
            closePanel()
        }
    }
})

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    initMap()
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
    stopAutoUpdate()
})

--[[
    ╔══════════════════════════════════════════╗
    ║   OBSIDIAN HUB  ·  Prison Auto-Farm      ║
    ║   Dark Glassmorphism UI                   ║
    ╚══════════════════════════════════════════╝
]]

-- Services
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local RS = game:GetService("ReplicatedStorage")
local GameEvent = RS.Events.GameEvent
local GameFunction = RS.Events.GameFunction
local GameBindable = RS.Events.GameBindable

-- ═══════════════════════════════════════════
--  STATE
-- ═══════════════════════════════════════════
local State = {
    AutoDig       = false,
    AutoPickup    = false,
    AutoSell      = false,
    AutoTrade     = false,
    AutoFreeLunch = false,
    Minimized     = false,
}

local Connections = {}
local GUI_NAME = "ObsidianHub_" .. tostring(math.random(100000, 999999))

-- Kill previous GUI if re-executed
for _, g in ipairs(player.PlayerGui:GetChildren()) do
    if g.Name:find("ObsidianHub_") then g:Destroy() end
end

-- ═══════════════════════════════════════════
--  UI CONSTRUCTION
-- ═══════════════════════════════════════════

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = GUI_NAME
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = player.PlayerGui

-- Palette
local Colors = {
    bg         = Color3.fromRGB(12, 12, 18),
    bgAccent   = Color3.fromRGB(18, 18, 28),
    card       = Color3.fromRGB(22, 22, 34),
    cardHover  = Color3.fromRGB(30, 30, 45),
    accent     = Color3.fromRGB(120, 80, 255),
    accentGlow = Color3.fromRGB(150, 110, 255),
    accentDim  = Color3.fromRGB(80, 50, 180),
    onColor    = Color3.fromRGB(80, 255, 120),
    offColor   = Color3.fromRGB(255, 60, 80),
    textPrimary   = Color3.fromRGB(235, 235, 245),
    textSecondary = Color3.fromRGB(140, 140, 165),
    border     = Color3.fromRGB(45, 45, 65),
    shadow     = Color3.fromRGB(5, 5, 10),
}

-- Helper: tween shorthand
local function tween(obj, props, duration, style, dir)
    return TweenService:Create(
        obj,
        TweenInfo.new(duration or 0.25, style or Enum.EasingStyle.Quart, dir or Enum.EasingDirection.Out),
        props
    )
end

-- ─── Main Frame ────────────────────────────
local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Size = UDim2.new(0, 280, 0, 380)
MainFrame.Position = UDim2.new(0.5, -140, 0.5, -190)
MainFrame.BackgroundColor3 = Colors.bg
MainFrame.BackgroundTransparency = 0.05
MainFrame.BorderSizePixel = 0
MainFrame.ClipsDescendants = true
MainFrame.Parent = ScreenGui

local MainCorner = Instance.new("UICorner", MainFrame)
MainCorner.CornerRadius = UDim.new(0, 14)

local MainStroke = Instance.new("UIStroke", MainFrame)
MainStroke.Color = Colors.border
MainStroke.Thickness = 1.2
MainStroke.Transparency = 0.3

-- Glow edge (top accent line)
local TopGlow = Instance.new("Frame", MainFrame)
TopGlow.Name = "TopGlow"
TopGlow.Size = UDim2.new(1, 0, 0, 2)
TopGlow.Position = UDim2.new(0, 0, 0, 0)
TopGlow.BackgroundColor3 = Colors.accent
TopGlow.BorderSizePixel = 0

local TopGlowGrad = Instance.new("UIGradient", TopGlow)
TopGlowGrad.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Colors.accentDim),
    ColorSequenceKeypoint.new(0.5, Colors.accentGlow),
    ColorSequenceKeypoint.new(1, Colors.accentDim),
})

-- ─── Title Bar ─────────────────────────────
local TitleBar = Instance.new("Frame", MainFrame)
TitleBar.Name = "TitleBar"
TitleBar.Size = UDim2.new(1, 0, 0, 50) -- Thicker for mobile dragging
TitleBar.Position = UDim2.new(0, 0, 0, 2)
TitleBar.BackgroundColor3 = Colors.bgAccent
TitleBar.BackgroundTransparency = 0.3
TitleBar.BorderSizePixel = 0

local TitleLabel = Instance.new("TextLabel", TitleBar)
TitleLabel.Name = "Title"
TitleLabel.Size = UDim2.new(1, -100, 1, 0)
TitleLabel.Position = UDim2.new(0, 16, 0, 0)
TitleLabel.BackgroundTransparency = 1
TitleLabel.Text = "⬥ OBSIDIAN HUB"
TitleLabel.TextColor3 = Colors.textPrimary
TitleLabel.TextSize = 16 -- Larger font
TitleLabel.Font = Enum.Font.GothamBold
TitleLabel.TextXAlignment = Enum.TextXAlignment.Left

local VersionLabel = Instance.new("TextLabel", TitleBar)
VersionLabel.Size = UDim2.new(0, 50, 0, 16)
VersionLabel.Position = UDim2.new(0, 160, 0.5, -8)
VersionLabel.BackgroundTransparency = 1
VersionLabel.Text = "v1.0"
VersionLabel.TextColor3 = Colors.textSecondary
VersionLabel.TextSize = 12
VersionLabel.Font = Enum.Font.Gotham
VersionLabel.TextXAlignment = Enum.TextXAlignment.Left

-- Minimize Button
local MinBtn = Instance.new("TextButton", TitleBar)
MinBtn.Name = "MinBtn"
MinBtn.Size = UDim2.new(0, 36, 0, 36) -- Larger touch target
MinBtn.Position = UDim2.new(1, -84, 0.5, -18)
MinBtn.BackgroundColor3 = Colors.card
MinBtn.BackgroundTransparency = 0.5
MinBtn.Text = "—"
MinBtn.TextColor3 = Colors.textSecondary
MinBtn.TextSize = 16
MinBtn.Font = Enum.Font.GothamBold
MinBtn.BorderSizePixel = 0

local MinBtnCorner = Instance.new("UICorner", MinBtn)
MinBtnCorner.CornerRadius = UDim.new(0, 8)

-- Close Button
local CloseBtn = Instance.new("TextButton", TitleBar)
CloseBtn.Name = "CloseBtn"
CloseBtn.Size = UDim2.new(0, 36, 0, 36) -- Larger touch target
CloseBtn.Position = UDim2.new(1, -42, 0.5, -18)
CloseBtn.BackgroundColor3 = Color3.fromRGB(180, 40, 50)
CloseBtn.BackgroundTransparency = 0.5
CloseBtn.Text = "✕"
CloseBtn.TextColor3 = Colors.textPrimary
CloseBtn.TextSize = 15
CloseBtn.Font = Enum.Font.GothamBold
CloseBtn.BorderSizePixel = 0

local CloseBtnCorner = Instance.new("UICorner", CloseBtn)
CloseBtnCorner.CornerRadius = UDim.new(0, 8)

-- ─── Content Area ──────────────────────────
local ContentFrame = Instance.new("ScrollingFrame", MainFrame)
ContentFrame.Name = "Content"
ContentFrame.Size = UDim2.new(1, -20, 1, -56)
ContentFrame.Position = UDim2.new(0, 10, 0, 50)
ContentFrame.BackgroundTransparency = 1
ContentFrame.BorderSizePixel = 0
ContentFrame.ScrollBarThickness = 3
ContentFrame.ScrollBarImageColor3 = Colors.accent
ContentFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
ContentFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y

local ContentLayout = Instance.new("UIListLayout", ContentFrame)
ContentLayout.SortOrder = Enum.SortOrder.LayoutOrder
ContentLayout.Padding = UDim.new(0, 8)

local ContentPadding = Instance.new("UIPadding", ContentFrame)
ContentPadding.PaddingTop = UDim.new(0, 4)
ContentPadding.PaddingBottom = UDim.new(0, 8)

-- ═══════════════════════════════════════════
--  TOGGLE BUTTON FACTORY
-- ═══════════════════════════════════════════

local function createToggle(parent, text, description, icon, layoutOrder, stateKey)
    -- Card container
    local card = Instance.new("Frame", parent)
    card.Name = stateKey .. "_Card"
    card.Size = UDim2.new(1, 0, 0, 64) -- Taller card for mobile taps
    card.BackgroundColor3 = Colors.card
    card.BackgroundTransparency = 0.15
    card.BorderSizePixel = 0
    card.LayoutOrder = layoutOrder

    local cardCorner = Instance.new("UICorner", card)
    cardCorner.CornerRadius = UDim.new(0, 10)

    local cardStroke = Instance.new("UIStroke", card)
    cardStroke.Color = Colors.border
    cardStroke.Thickness = 1
    cardStroke.Transparency = 0.6

    -- Left accent bar
    local accentBar = Instance.new("Frame", card)
    accentBar.Name = "AccentBar"
    accentBar.Size = UDim2.new(0, 3, 0.6, 0)
    accentBar.Position = UDim2.new(0, 0, 0.2, 0)
    accentBar.BackgroundColor3 = Colors.offColor
    accentBar.BorderSizePixel = 0

    local accentBarCorner = Instance.new("UICorner", accentBar)
    accentBarCorner.CornerRadius = UDim.new(0, 2)

    -- Icon
    local iconLabel = Instance.new("TextLabel", card)
    iconLabel.Name = "Icon"
    iconLabel.Size = UDim2.new(0, 28, 0, 28)
    iconLabel.Position = UDim2.new(0, 12, 0.5, -14)
    iconLabel.BackgroundTransparency = 1
    iconLabel.Text = icon
    iconLabel.TextSize = 18
    iconLabel.Font = Enum.Font.GothamBold
    iconLabel.TextColor3 = Colors.textPrimary

    -- Title
    local title = Instance.new("TextLabel", card)
    title.Name = "Title"
    title.Size = UDim2.new(1, -110, 0, 20)
    title.Position = UDim2.new(0, 48, 0, 10)
    title.BackgroundTransparency = 1
    title.Text = text
    title.TextColor3 = Colors.textPrimary
    title.TextSize = 15 -- Larger text
    title.Font = Enum.Font.GothamSemibold
    title.TextXAlignment = Enum.TextXAlignment.Left

    -- Description
    local desc = Instance.new("TextLabel", card)
    desc.Name = "Desc"
    desc.Size = UDim2.new(1, -110, 0, 16)
    desc.Position = UDim2.new(0, 48, 0, 32)
    desc.BackgroundTransparency = 1
    desc.Text = description
    desc.TextColor3 = Colors.textSecondary
    desc.TextSize = 11 -- Larger text
    desc.Font = Enum.Font.Gotham
    desc.TextXAlignment = Enum.TextXAlignment.Left

    -- Toggle track
    local toggleTrack = Instance.new("Frame", card)
    toggleTrack.Name = "Track"
    toggleTrack.Size = UDim2.new(0, 48, 0, 26) -- Larger toggle
    toggleTrack.Position = UDim2.new(1, -60, 0.5, -13)
    toggleTrack.BackgroundColor3 = Colors.offColor
    toggleTrack.BackgroundTransparency = 0.5
    toggleTrack.BorderSizePixel = 0

    local trackCorner = Instance.new("UICorner", toggleTrack)
    trackCorner.CornerRadius = UDim.new(1, 0)

    -- Toggle knob
    local knob = Instance.new("Frame", toggleTrack)
    knob.Name = "Knob"
    knob.Size = UDim2.new(0, 22, 0, 22) -- Larger knob
    knob.Position = UDim2.new(0, 2, 0.5, -11)
    knob.BackgroundColor3 = Colors.textPrimary
    knob.BorderSizePixel = 0

    local knobCorner = Instance.new("UICorner", knob)
    knobCorner.CornerRadius = UDim.new(1, 0)

    local knobShadow = Instance.new("UIStroke", knob)
    knobShadow.Color = Colors.shadow
    knobShadow.Thickness = 1
    knobShadow.Transparency = 0.5

    -- Status dot
    local statusDot = Instance.new("Frame", card)
    statusDot.Name = "StatusDot"
    statusDot.Size = UDim2.new(0, 6, 0, 6)
    statusDot.Position = UDim2.new(1, -66, 0.5, -3)
    statusDot.BackgroundColor3 = Colors.offColor
    statusDot.BorderSizePixel = 0

    local statusDotCorner = Instance.new("UICorner", statusDot)
    statusDotCorner.CornerRadius = UDim.new(1, 0)

    -- Click handler
    local clickBtn = Instance.new("TextButton", card)
    clickBtn.Name = "ClickZone"
    clickBtn.Size = UDim2.new(1, 0, 1, 0)
    clickBtn.BackgroundTransparency = 1
    clickBtn.Text = ""
    clickBtn.ZIndex = 5

    local function updateVisual(enabled)
        local targetTrackColor = enabled and Colors.onColor or Colors.offColor
        local targetKnobPos = enabled and UDim2.new(1, -24, 0.5, -11) or UDim2.new(0, 2, 0.5, -11)

        tween(toggleTrack, {BackgroundColor3 = targetTrackColor, BackgroundTransparency = enabled and 0.3 or 0.5}, 0.3):Play()
        tween(knob, {Position = targetKnobPos}, 0.3, Enum.EasingStyle.Back):Play()
        tween(accentBar, {BackgroundColor3 = targetTrackColor}, 0.3):Play()
        tween(statusDot, {BackgroundColor3 = targetTrackColor}, 0.3):Play()
        tween(cardStroke, {Color = enabled and Colors.onColor or Colors.border, Transparency = enabled and 0.7 or 0.6}, 0.3):Play()
    end

    clickBtn.MouseButton1Click:Connect(function()
        State[stateKey] = not State[stateKey]
        updateVisual(State[stateKey])
    end)

    -- Hover effect
    clickBtn.MouseEnter:Connect(function()
        tween(card, {BackgroundColor3 = Colors.cardHover, BackgroundTransparency = 0.05}, 0.2):Play()
    end)

    clickBtn.MouseLeave:Connect(function()
        tween(card, {BackgroundColor3 = Colors.card, BackgroundTransparency = 0.15}, 0.2):Play()
    end)

    return card, updateVisual
end

-- ─── Section Header ────────────────────────
local function createSectionHeader(parent, text, layoutOrder)
    local header = Instance.new("TextLabel", parent)
    header.Name = text .. "_Header"
    header.Size = UDim2.new(1, 0, 0, 20)
    header.BackgroundTransparency = 1
    header.Text = "  " .. text:upper()
    header.TextColor3 = Colors.accent
    header.TextSize = 10
    header.Font = Enum.Font.GothamBold
    header.TextXAlignment = Enum.TextXAlignment.Left
    header.LayoutOrder = layoutOrder
    return header
end

-- ═══════════════════════════════════════════
--  BUILD TOGGLES
-- ═══════════════════════════════════════════

createSectionHeader(ContentFrame, "⛏  Mining", 0)

createToggle(
    ContentFrame,
    "Auto Dig",
    "Automatically digs terrain",
    "⛏",
    1,
    "AutoDig"
)

createToggle(
    ContentFrame,
    "Auto Pickup",
    "Grabs all nearby items",
    "🎒",
    2,
    "AutoPickup"
)

createSectionHeader(ContentFrame, "💰  Economy", 10)

createToggle(
    ContentFrame,
    "Auto Sell",
    "Sells sack at Seller NPC",
    "💵",
    11,
    "AutoSell"
)

createToggle(
    ContentFrame,
    "Auto Trade",
    "Trades with available NPCs",
    "🤝",
    12,
    "AutoTrade"
)

createToggle(
    ContentFrame,
    "Auto Free Lunch",
    "Claims free chest when ready",
    "🍱",
    13,
    "AutoFreeLunch"
)

-- ─── Status bar at bottom ──────────────────
local StatusBar = Instance.new("Frame", MainFrame)
StatusBar.Name = "StatusBar"
StatusBar.Size = UDim2.new(1, 0, 0, 2)
StatusBar.Position = UDim2.new(0, 0, 1, -2)
StatusBar.BackgroundColor3 = Colors.accent
StatusBar.BorderSizePixel = 0
StatusBar.BackgroundTransparency = 0.5

-- Pulse animation on status bar
task.spawn(function()
    while ScreenGui.Parent do
        local anyActive = false
        for _, v in pairs(State) do
            if v == true then anyActive = true break end
        end
        if anyActive then
            tween(StatusBar, {BackgroundTransparency = 0.2}, 0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut):Play()
            task.wait(0.8)
            tween(StatusBar, {BackgroundTransparency = 0.7}, 0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut):Play()
            task.wait(0.8)
        else
            StatusBar.BackgroundTransparency = 0.8
            task.wait(0.5)
        end
    end
end)

-- ═══════════════════════════════════════════
--  DRAGGING
-- ═══════════════════════════════════════════
do
    local dragging, dragInput, dragStart, startPos

    TitleBar.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = MainFrame.Position

            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    TitleBar.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local delta = input.Position - dragStart
            MainFrame.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + delta.X,
                startPos.Y.Scale, startPos.Y.Offset + delta.Y
            )
        end
    end)
end

-- ═══════════════════════════════════════════
--  MINIMIZE / CLOSE
-- ═══════════════════════════════════════════
local expandedSize = MainFrame.Size

MinBtn.MouseButton1Click:Connect(function()
    State.Minimized = not State.Minimized
    if State.Minimized then
        tween(MainFrame, {Size = UDim2.new(0, 280, 0, 52)}, 0.35, Enum.EasingStyle.Back, Enum.EasingDirection.In):Play()
        ContentFrame.Visible = false
        StatusBar.Visible = false
        MinBtn.Text = "+"
    else
        ContentFrame.Visible = true
        StatusBar.Visible = true
        tween(MainFrame, {Size = expandedSize}, 0.35, Enum.EasingStyle.Back):Play()
        MinBtn.Text = "—"
    end
end)

CloseBtn.MouseButton1Click:Connect(function()
    -- Cleanup connections
    for _, conn in pairs(Connections) do
        if typeof(conn) == "RBXScriptConnection" then
            conn:Disconnect()
        end
    end
    -- Reset states
    for k in pairs(State) do
        State[k] = false
    end
    -- Fade out
    tween(MainFrame, {Size = UDim2.new(0, 280, 0, 0), BackgroundTransparency = 1}, 0.3):Play()
    task.wait(0.35)
    ScreenGui:Destroy()
end)

-- ═══════════════════════════════════════════
--  GAME LOGIC
-- ═══════════════════════════════════════════

local function getCharacter()
    return player.Character or player.CharacterAdded:Wait()
end

local function getHRP()
    local char = getCharacter()
    return char and char:FindFirstChild("HumanoidRootPart")
end

local function getNPCByName(name)
    local npcs = workspace:FindFirstChild("Map")
        and workspace.Map:FindFirstChild("Functional")
        and workspace.Map.Functional:FindFirstChild("SpawnedNPCs")
    if npcs then
        return npcs:FindFirstChild(name)
    end
    return nil
end

local function getSellerNPC()
    return getNPCByName("Seller")
end

local function getAllDigItems()
    local items = {}
    local spawnedItems = workspace:FindFirstChild("Map")
        and workspace.Map:FindFirstChild("Functional")
        and workspace.Map.Functional:FindFirstChild("SpawnedItems")
    if spawnedItems then
        for _, rarityFolder in ipairs(spawnedItems:GetChildren()) do
            if rarityFolder:IsA("Model") or rarityFolder:IsA("Folder") then
                for _, item in ipairs(rarityFolder:GetChildren()) do
                    if item:GetAttribute("UID") then
                        table.insert(items, item)
                    end
                end
            end
        end
    end
    return items
end

local function getMainDigZone()
    local map = workspace:FindFirstChild("Map")
    if map then
        local func = map:FindFirstChild("Functional")
        if func then
            return func:FindFirstChild("MainDigZone")
        end
    end
    return nil
end

local function teleportTo(pos)
    local hrp = getHRP()
    if hrp then
        hrp.CFrame = CFrame.new(pos)
    end
end

-- ─── Auto Dig Loop ─────────────────────────
task.spawn(function()
    while ScreenGui.Parent do
        if State.AutoDig then
            pcall(function()
                local digZone = getMainDigZone()
                if digZone then
                    local allowBox = digZone:FindFirstChild("AllowDiggingBox")
                    if allowBox then
                        local hrp = getHRP()
                        if hrp then
                            -- Check if we have a digging tool equipped
                            local char = getCharacter()
                            local tool = nil
                            for _, child in ipairs(char:GetChildren()) do
                                if child:IsA("Tool") then
                                    tool = child
                                    break
                                end
                            end

                            -- Raycast down into terrain from player position
                            local origin = hrp.Position
                            local direction = Vector3.new(0, -10, 0)
                            local params = RaycastParams.new()
                            params.FilterType = Enum.RaycastFilterType.Include
                            params.FilterDescendantsInstances = {workspace.Terrain}

                            local result = workspace:Raycast(origin, direction, params)
                            if result and result.Instance == workspace.Terrain then
                                -- Fire the dig remote
                                local toolItem = nil
                                if player:FindFirstChild("hiddenstats") then
                                    local equipped = player.hiddenstats:FindFirstChild("EquippedTool")
                                    if equipped then
                                        toolItem = equipped.Value
                                    end
                                end
                                GameFunction:InvokeServer(
                                    "UseTool",
                                    toolItem or "Spoon",
                                    result.Instance,
                                    result.Position,
                                    result.Normal,
                                    result.Material
                                )
                            end
                        end
                    end
                end
            end)
        end
        task.wait(0.3)
    end
end)

-- ─── Auto Pickup Loop ─────────────────────
task.spawn(function()
    while ScreenGui.Parent do
        if State.AutoPickup then
            pcall(function()
                local items = getAllDigItems()
                local hrp = getHRP()
                if hrp then
                    for _, item in ipairs(items) do
                        if State.AutoPickup == false then break end
                        local uid = item:GetAttribute("UID")
                        local dzUID = item:GetAttribute("DigzoneUID")
                        if uid then
                            -- Check sack capacity
                            local currentSack = 0
                            local maxSack = 999
                            if player:FindFirstChild("hiddenstats") then
                                local cs = player.hiddenstats:FindFirstChild("CurrentSackSize")
                                local ms = player.hiddenstats:FindFirstChild("MaxSackSize")
                                if cs then currentSack = cs.Value end
                                if ms then maxSack = ms.Value end
                            end

                            if currentSack < maxSack or item:GetAttribute("GiveTool") then
                                -- Find item position for teleport
                                local itemRoot = item:FindFirstChild("Root", true)
                                    or item:FindFirstChildWhichIsA("BasePart", true)
                                if itemRoot then
                                    -- Teleport near item
                                    local savedCF = hrp.CFrame
                                    hrp.CFrame = itemRoot.CFrame * CFrame.new(0, 2, 0)
                                    task.wait(0.4) -- Wait for server to register position
                                end

                                GameBindable:Fire("AttemptCollectDigItem", item)
                                task.wait(0.15)
                            end
                        end
                    end
                end
            end)
        end
        task.wait(0.5)
    end
end)

-- ─── Auto Sell Loop ────────────────────────
task.spawn(function()
    while ScreenGui.Parent do
        if State.AutoSell then
            pcall(function()
                local seller = getSellerNPC()
                if seller then
                    local hrp = getHRP()
                    if hrp then
                        -- Check if sack has items
                        local currentSack = 0
                        if player:FindFirstChild("hiddenstats") then
                            local cs = player.hiddenstats:FindFirstChild("CurrentSackSize")
                            if cs then currentSack = cs.Value end
                        end

                        if currentSack > 0 then
                            -- Teleport to seller
                            local sellerRoot = seller:FindFirstChild("HumanoidRootPart")
                                or seller:FindFirstChildWhichIsA("BasePart", true)
                            if sellerRoot then
                                hrp.CFrame = sellerRoot.CFrame * CFrame.new(0, 0, 3)
                                task.wait(0.4) -- Wait for server to register position
                            end

                            -- Fire trade with Seller NPC
                            GameEvent:FireServer("AttemptTrade", seller)
                            task.wait(0.2)
                        end
                    end
                end
            end)
        end
        task.wait(1.5)
    end
end)

-- ─── Auto Trade Loop ──────────────────────
task.spawn(function()
    while ScreenGui.Parent do
        if State.AutoTrade then
            pcall(function()
                local npcs = workspace:FindFirstChild("Map")
                    and workspace.Map:FindFirstChild("Functional")
                    and workspace.Map.Functional:FindFirstChild("SpawnedNPCs")
                if npcs then
                    local hrp = getHRP()
                    if hrp then
                        for _, npc in ipairs(npcs:GetChildren()) do
                            if State.AutoTrade == false then break end
                            -- Trade with non-guard NPCs
                            if npc:IsA("Model") and npc.Name ~= "Guard" then
                                local npcRoot = npc:FindFirstChild("HumanoidRootPart")
                                    or npc:FindFirstChildWhichIsA("BasePart", true)
                                if npcRoot then
                                    hrp.CFrame = npcRoot.CFrame * CFrame.new(0, 0, 3)
                                    task.wait(0.4) -- Wait for server to register position
                                    GameEvent:FireServer("AttemptTrade", npc)
                                    task.wait(0.3)
                                end
                            end
                        end
                    end
                end
            end)
        end
        task.wait(2)
    end
end)

-- ─── Auto Free Lunch Loop ─────────────────
task.spawn(function()
    while ScreenGui.Parent do
        if State.AutoFreeLunch then
            pcall(function()
                GameEvent:FireServer("OpenFreeChest")
            end)
        end
        task.wait(5)
    end
end)

-- ═══════════════════════════════════════════
--  INTRO ANIMATION
-- ═══════════════════════════════════════════
MainFrame.Size = UDim2.new(0, 280, 0, 0)
MainFrame.BackgroundTransparency = 1
task.wait(0.1)
tween(MainFrame, {Size = expandedSize, BackgroundTransparency = 0.05}, 0.5, Enum.EasingStyle.Back):Play()

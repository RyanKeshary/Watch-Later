// render_video.swift
// Note: This script must be executed from the repository root, or supply the output path as argument 1.
// Usage: swift render_video.swift [optional_output_path]

import Foundation
import AVFoundation
import CoreGraphics
import CoreText
import ImageIO

let defaultOutputPath = "web/public/watch-later-launch.mp4"
let resolvedPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : defaultOutputPath
let outputURL = URL(fileURLWithPath: resolvedPath)
try? FileManager.default.removeItem(at: outputURL)

let width = 1920
let height = 1080
let fps: Int32 = 30
let durationSeconds = 16
let totalFrames = durationSeconds * Int(fps)

guard let assetWriter = try? AVAssetWriter(outputURL: outputURL, fileType: .mp4) else {
    fputs("Error: Failed to create AVAssetWriter for path: \(outputURL.path)\n", stderr)
    exit(1)
}

let videoSettings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height
]

let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
let attributes: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
]

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: writerInput,
    sourcePixelBufferAttributes: attributes
)

writerInput.expectsMediaDataInRealTime = false
assetWriter.add(writerInput)
assetWriter.startWriting()
assetWriter.startSession(atSourceTime: .zero)

func newPixelBuffer() -> CVPixelBuffer? {
    var buffer: CVPixelBuffer?
    let status = CVPixelBufferCreate(
        kCFAllocatorDefault,
        width,
        height,
        kCVPixelFormatType_32ARGB,
        attributes as CFDictionary,
        &buffer
    )
    guard status == kCVReturnSuccess else { return nil }
    return buffer
}

let colorSpace = CGColorSpaceCreateDeviceRGB()

struct Scene {
    let tag: String
    let headline: String
    let sub: String
    let primary: String
    let secondary: String
}

let scenes = [
    Scene(tag: "ACT 01 // THE REAL PROBLEM",
          headline: "Saved reels go to die.",
          sub: "Scattered across DMs to yourself, screenshots, and Instagram's bottomless Saved folder.",
          primary: "842 Saved Posts (Never Re-opened)",
          secondary: "DMs: 'watch this later'"),
    Scene(tag: "ACT 02 // ONE SIMPLE HABIT",
          headline: "Share, don't save.",
          sub: "Tap share on Instagram and pick Watch Later. Zero popup forms, zero interruptions.",
          primary: "Silent Background Intercept",
          secondary: "Instant dismiss → Stay in your feed"),
    Scene(tag: "ACT 03 // SUBSTANCE EXTRACTION",
          headline: "Captions, audio & transcripts.",
          sub: "Audio speech-to-text, creator details, and semantic topics extracted automatically.",
          primary: "Parsed Pillar: Systems & Architecture",
          secondary: "Full transcript indexed & searchable"),
    Scene(tag: "ACT 04 // SELF-CLEANING QUEUE",
          headline: "Watch it. It disappears.",
          sub: "Once completed, reels auto-purge so an overwhelming backlog never accumulates.",
          primary: "Zero Backlog Guarantee",
          secondary: "Clean, curated library ready to learn"),
    Scene(tag: "ACT 05 // WATCH LATER",
          headline: "Never lose a reel worth revisiting.",
          sub: "Download the native Android App (APK) today.",
          primary: "Native Android App (APK)",
          secondary: "Direct Download · Free")
]

for frameIndex in 0..<totalFrames {
    while !writerInput.isReadyForMoreMediaData {
        usleep(1000)
    }

    guard let pixelBuffer = newPixelBuffer() else {
        fputs("Error: Failed to allocate pixel buffer at frame \(frameIndex)\n", stderr)
        try? FileManager.default.removeItem(at: outputURL)
        exit(1)
    }
    CVPixelBufferLockBaseAddress(pixelBuffer, [])

    let data = CVPixelBufferGetBaseAddress(pixelBuffer)
    guard let context = CGContext(
        data: data,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else {
        CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        fputs("Error: Failed to create CGContext at frame \(frameIndex)\n", stderr)
        try? FileManager.default.removeItem(at: outputURL)
        exit(1)
    }

    let progress = Double(frameIndex) / Double(totalFrames)
    let time = Double(frameIndex) / Double(fps)
    let sceneIdx = min(Int(time / 3.2), scenes.count - 1)
    let currentScene = scenes[sceneIdx]

    // Background: Deep obsidian (#09090b)
    context.setFillColor(red: 9/255.0, green: 9/255.0, blue: 11/255.0, alpha: 1.0)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    // Subtle Vignette / Spotlight
    let center = CGPoint(x: width / 2, y: height / 2)
    let radialGradient = CGGradient(colorsSpace: colorSpace, colors: [
        CGColor(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 0.05),
        CGColor(red: 0/255.0, green: 0/255.0, blue: 0/255.0, alpha: 0.4)
    ] as CFArray, locations: [0.0, 1.0])!
    context.drawRadialGradient(radialGradient, startCenter: center, startRadius: 50, endCenter: center, endRadius: 900, options: [])

    // Draw Grid Lines
    context.setStrokeColor(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 0.03)
    context.setLineWidth(1)
    for x in stride(from: 0, to: width, by: 60) {
        context.move(to: CGPoint(x: x, y: 0))
        context.addLine(to: CGPoint(x: x, y: height))
    }
    for y in stride(from: 0, to: height, by: 60) {
        context.move(to: CGPoint(x: 0, y: y))
        context.addLine(to: CGPoint(x: width, y: y))
    }
    context.strokePath()

    // Draw Top Header
    let fontName = "Helvetica-Bold" as CFString
    let regularFont = "Helvetica" as CFString

    func drawText(_ text: String, x: CGFloat, y: CGFloat, size: CGFloat, color: (CGFloat, CGFloat, CGFloat), bold: Bool = false) {
        let font = CTFontCreateWithName(bold ? fontName : regularFont, size, nil)
        let textColor = CGColor(red: color.0, green: color.1, blue: color.2, alpha: 1.0)
        let attrs: [CFString: Any] = [
            kCTFontAttributeName: font,
            kCTForegroundColorAttributeName: textColor
        ]
        let attrString = CFAttributedStringCreate(nil, text as CFString, attrs as CFDictionary)!
        let line = CTLineCreateWithAttributedString(attrString)
        context.textPosition = CGPoint(x: x, y: y)
        CTLineDraw(line, context)
    }

    // Top Bar (matching rendered 1080p 30fps)
    drawText("WATCH LATER", x: 100, y: CGFloat(height - 100), size: 18, color: (1.0, 1.0, 1.0), bold: true)
    drawText("OFFICIAL PRODUCT LAUNCH", x: 260, y: CGFloat(height - 100), size: 14, color: (0.45, 0.45, 0.5))
    drawText("1080P 30FPS", x: CGFloat(width - 220), y: CGFloat(height - 100), size: 14, color: (0.1, 0.8, 0.5), bold: true)

    // Scene Tag
    drawText(currentScene.tag, x: 100, y: CGFloat(height - 240), size: 20, color: (0.2, 0.7, 1.0), bold: true)

    // Scene Headline
    drawText(currentScene.headline, x: 100, y: CGFloat(height - 350), size: 68, color: (1.0, 1.0, 1.0), bold: true)

    // Scene Subtitle
    drawText(currentScene.sub, x: 100, y: CGFloat(height - 430), size: 26, color: (0.65, 0.65, 0.7))

    // Interactive Simulation Card
    let cardRect = CGRect(x: 100, y: 160, width: width - 200, height: 260)
    context.setFillColor(red: 22/255.0, green: 22/255.0, blue: 26/255.0, alpha: 0.95)
    let cardPath = CGPath(roundedRect: cardRect, cornerWidth: 24, cornerHeight: 24, transform: nil)
    context.addPath(cardPath)
    context.fillPath()

    context.setStrokeColor(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 0.15)
    context.setLineWidth(2)
    context.addPath(cardPath)
    context.strokePath()

    drawText("FEATURE SHOWCASE", x: 140, y: 360, size: 14, color: (0.5, 0.5, 0.55), bold: true)
    drawText(currentScene.primary, x: 140, y: 290, size: 36, color: (1.0, 1.0, 1.0), bold: true)
    drawText(currentScene.secondary, x: 140, y: 230, size: 22, color: (0.1, 0.8, 0.5))

    // Bottom Timeline Bar
    let timelineY: CGFloat = 80
    context.setFillColor(red: 30/255.0, green: 30/255.0, blue: 35/255.0, alpha: 1.0)
    let bgBar = CGPath(roundedRect: CGRect(x: 100, y: timelineY, width: CGFloat(width - 200), height: 8), cornerWidth: 4, cornerHeight: 4, transform: nil)
    context.addPath(bgBar)
    context.fillPath()

    context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)
    let fgWidth = CGFloat(width - 200) * CGFloat(progress)
    let fgBar = CGPath(roundedRect: CGRect(x: 100, y: timelineY, width: fgWidth, height: 8), cornerWidth: 4, cornerHeight: 4, transform: nil)
    context.addPath(fgBar)
    context.fillPath()

    let curSec = String(format: "%02d", Int(time))
    let curFr = String(format: "%02d", frameIndex % Int(fps))
    drawText("TIMELINE: 00:\(curSec):\(curFr) / 00:16:00", x: 100, y: 45, size: 13, color: (0.5, 0.5, 0.55))
    drawText("TAGLINE: Never lose a reel worth revisiting.", x: CGFloat(width - 450), y: 45, size: 13, color: (0.8, 0.8, 0.85))

    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])

    let presentTime = CMTime(value: Int64(frameIndex), timescale: fps)
    if !adaptor.append(pixelBuffer, withPresentationTime: presentTime) {
        fputs("Error: Failed to append pixel buffer at frame \(frameIndex): \(assetWriter.error?.localizedDescription ?? "unknown error")\n", stderr)
        try? FileManager.default.removeItem(at: outputURL)
        exit(1)
    }
}

writerInput.markAsFinished()
let group = DispatchGroup()
group.enter()
assetWriter.finishWriting {
    group.leave()
}
group.wait()

guard assetWriter.status == .completed else {
    fputs("Error: AVAssetWriter failed with status \(assetWriter.status.rawValue): \(assetWriter.error?.localizedDescription ?? "unknown error")\n", stderr)
    try? FileManager.default.removeItem(at: outputURL)
    exit(1)
}

print("Successfully generated watch-later-launch.mp4 at \(outputURL.path)!")

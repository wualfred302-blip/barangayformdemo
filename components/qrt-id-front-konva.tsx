"use client"

import { forwardRef } from "react"
import { Stage, Layer, Rect, Text, Circle, Image as KonvaImage, Group } from "react-konva"
import useImage from "use-image"
import Konva from "konva"

interface QRTIDFrontKonvaProps {
  qrtCode: string
  verificationCode: string
  fullName: string
  birthDate: string
  address: string
  gender: string
  civilStatus: string
  birthPlace: string
  photoUrl: string
  issuedDate: string
}

const QRTIDFrontKonva = forwardRef<Konva.Stage, QRTIDFrontKonvaProps>(
  (
    {
      qrtCode,
      verificationCode,
      fullName,
      birthDate,
      address,
      gender,
      civilStatus,
      birthPlace,
      photoUrl,
      issuedDate,
    },
    ref
  ) => {
    const [photo] = useImage(photoUrl, "anonymous")

    return (
      <Stage width={856} height={540} ref={ref}>
        <Layer>
          {/* Background Gradient (simulated with multiple rects) */}
          <Rect x={0} y={0} width={856} height={180} fill="#eff6ff" />
          <Rect x={0} y={180} width={856} height={180} fill="#ffffff" />
          <Rect x={0} y={360} width={856} height={180} fill="#fdf2f8" />

          {/* Header Bar - Blue Gradient */}
          <Rect
            x={0}
            y={0}
            width={856}
            height={60}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 856, y: 0 }}
            fillLinearGradientColorStops={[0, "#2563eb", 1, "#1e40af"]}
          />

          {/* Left side of header - Flag circle and text */}
          <Circle x={50} y={30} radius={20} fill="#ffffff" />
          <Text
            x={50}
            y={30}
            text="🇵🇭"
            fontSize={20}
            offsetX={10}
            offsetY={10}
          />

          <Text
            x={80}
            y={16}
            text="REPUBLIKA NG PILIPINAS"
            fontSize={10}
            fontStyle="bold"
            fill="#ffffff"
          />
          <Text
            x={80}
            y={32}
            text="BARANGAY MAWAQUE"
            fontSize={12}
            fontStyle="bold"
            fill="#ffffff"
          />

          {/* Right side of header */}
          <Text
            x={650}
            y={12}
            text="QUICK RESPONSE TEAM"
            fontSize={14}
            fontStyle="bold"
            fill="#ffffff"
          />
          <Text
            x={650}
            y={32}
            text="QRT ID"
            fontSize={20}
            fontStyle="bold"
            fill="#ffffff"
          />

          {/* Photo */}
          <Rect
            x={32}
            y={80}
            width={180}
            height={220}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={3}
          />
          {photo && (
            <KonvaImage
              x={35}
              y={83}
              width={174}
              height={214}
              image={photo}
            />
          )}

          {/* Verification Code Box Below Photo */}
          <Rect
            x={32}
            y={315}
            width={180}
            height={60}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 180, y: 0 }}
            fillLinearGradientColorStops={[0, "#2563eb", 1, "#1e40af"]}
            cornerRadius={4}
          />
          <Text
            x={122}
            y={322}
            text="VERIFICATION CODE"
            fontSize={9}
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            offsetX={90}
          />
          <Text
            x={122}
            y={338}
            text={verificationCode}
            fontSize={11}
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            offsetX={90}
          />
          <Text
            x={122}
            y={355}
            text="Scan for secure verification"
            fontSize={8}
            fill="#d1d5db"
            align="center"
            offsetX={90}
          />

          {/* Right side - Personal Information */}
          <Text
            x={240}
            y={90}
            text="FULL NAME"
            fontSize={11}
            fontStyle="bold"
            fill="#374151"
          />
          <Text
            x={240}
            y={108}
            text={fullName.toUpperCase()}
            fontSize={18}
            fontStyle="bold"
            fill="#111827"
          />

          <Text
            x={240}
            y={145}
            text="DATE OF BIRTH"
            fontSize={10}
            fill="#6b7280"
          />
          <Text
            x={240}
            y={162}
            text={birthDate}
            fontSize={13}
            fontStyle="bold"
            fill="#111827"
          />

          <Text
            x={450}
            y={145}
            text="GENDER"
            fontSize={10}
            fill="#6b7280"
          />
          <Text
            x={450}
            y={162}
            text={gender}
            fontSize={13}
            fontStyle="bold"
            fill="#111827"
          />

          <Text
            x={240}
            y={195}
            text="CIVIL STATUS"
            fontSize={10}
            fill="#6b7280"
          />
          <Text
            x={240}
            y={212}
            text={civilStatus}
            fontSize={13}
            fontStyle="bold"
            fill="#111827"
          />

          <Text
            x={450}
            y={195}
            text="BIRTH PLACE"
            fontSize={10}
            fill="#6b7280"
          />
          <Text
            x={450}
            y={212}
            text={birthPlace}
            fontSize={13}
            fontStyle="bold"
            fill="#111827"
            width={370}
            wrap="none"
            ellipsis={true}
          />

          <Text
            x={240}
            y={245}
            text="ADDRESS"
            fontSize={10}
            fill="#6b7280"
          />
          <Text
            x={240}
            y={262}
            text={address}
            fontSize={13}
            fontStyle="bold"
            fill="#111827"
            width={580}
            wrap="word"
          />

          {/* Watermark */}
          <Text
            x={856 / 2}
            y={270}
            text="QRT"
            fontSize={120}
            fontStyle="bold"
            fill="#000000"
            opacity={0.05}
            rotation={-15}
            offsetX={100}
            offsetY={60}
          />

          {/* Footer Bar - Dark Gray */}
          <Rect x={0} y={490} width={856} height={50} fill="#374151" />

          {/* Footer Text */}
          <Text
            x={32}
            y={498}
            text={`Issued: ${issuedDate}`}
            fontSize={11}
            fontStyle="bold"
            fill="#ffffff"
          />
          <Text
            x={32}
            y={515}
            text="BARANGAY MAWAQUE LINKOD"
            fontSize={9}
            fill="#d1d5db"
          />

          <Text
            x={500}
            y={498}
            text="This card is property of Barangay Mawaque"
            fontSize={9}
            fill="#d1d5db"
            width={330}
            align="right"
          />
          <Text
            x={500}
            y={513}
            text="Return if found. Valid for one year from issue date."
            fontSize={9}
            fill="#d1d5db"
            width={330}
            align="right"
          />
        </Layer>
      </Stage>
    )
  }
)

QRTIDFrontKonva.displayName = "QRTIDFrontKonva"

export { QRTIDFrontKonva }

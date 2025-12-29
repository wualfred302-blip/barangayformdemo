"use client"

import { forwardRef } from "react"
import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva"
import useImage from "use-image"
import Konva from "konva"

interface QRTIDBackKonvaProps {
  qrtCode: string
  verificationCode: string
  height: string
  weight: string
  yearsResident: number
  citizenship: string
  emergencyContactName: string
  emergencyContactAddress: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  qrCodeDataUrl: string
  issuedDate: string
  expiryDate: string
}

const QRTIDBackKonva = forwardRef<Konva.Stage, QRTIDBackKonvaProps>(
  (
    {
      qrtCode,
      verificationCode,
      height,
      weight,
      yearsResident,
      citizenship,
      emergencyContactName,
      emergencyContactAddress,
      emergencyContactPhone,
      emergencyContactRelationship,
      qrCodeDataUrl,
      issuedDate,
      expiryDate,
    },
    ref
  ) => {
    const [qrImage] = useImage(qrCodeDataUrl, "anonymous")

    return (
      <Stage width={856} height={540} ref={ref}>
        <Layer>
          {/* Background Gradient (reversed - pink to white to blue) */}
          <Rect x={0} y={0} width={856} height={180} fill="#fdf2f8" />
          <Rect x={0} y={180} width={856} height={180} fill="#ffffff" />
          <Rect x={0} y={360} width={856} height={180} fill="#eff6ff" />

          {/* Header Bar - Pink Gradient */}
          <Rect
            x={0}
            y={0}
            width={856}
            height={60}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 856, y: 0 }}
            fillLinearGradientColorStops={[0, "#db2777", 1, "#be185d"]}
          />

          <Text
            x={30}
            y={15}
            text="EMERGENCY INFORMATION"
            fontSize={14}
            fontStyle="bold"
            fill="#ffffff"
          />
          <Text
            x={30}
            y={35}
            text={`VERIFICATION CODE: ${verificationCode}`}
            fontSize={10}
            fill="#ffffff"
          />

          {/* Physical Information Box */}
          <Rect
            x={30}
            y={80}
            width={796}
            height={80}
            stroke="#2563eb"
            strokeWidth={2}
            cornerRadius={8}
          />

          <Text
            x={40}
            y={90}
            text="PHYSICAL INFORMATION"
            fontSize={11}
            fontStyle="bold"
            fill="#1f2937"
          />

          {/* 4 columns: Height, Weight, Years Resident, Citizenship */}
          <Text
            x={50}
            y={115}
            text="HEIGHT"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={50}
            y={132}
            text={height}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={250}
            y={115}
            text="WEIGHT"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={250}
            y={132}
            text={weight}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={450}
            y={115}
            text="YEARS RESIDENT"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={450}
            y={132}
            text={yearsResident.toString()}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={650}
            y={115}
            text="CITIZENSHIP"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={650}
            y={132}
            text={citizenship}
            fontSize={11}
            fill="#1f2937"
          />

          {/* Emergency Contact Box - Red/Orange Gradient Background */}
          <Rect
            x={30}
            y={180}
            width={600}
            height={160}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 600, y: 0 }}
            fillLinearGradientColorStops={[0, "#fee2e2", 0.5, "#ffedd5", 1, "#fee2e2"]}
            cornerRadius={8}
          />
          <Rect
            x={30}
            y={180}
            width={600}
            height={160}
            stroke="#dc2626"
            strokeWidth={2}
            cornerRadius={8}
          />

          <Text
            x={40}
            y={190}
            text="EMERGENCY CONTACT"
            fontSize={11}
            fontStyle="bold"
            fill="#dc2626"
          />

          <Text
            x={50}
            y={215}
            text="NAME"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={50}
            y={232}
            text={emergencyContactName}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={350}
            y={215}
            text="RELATIONSHIP"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={350}
            y={232}
            text={emergencyContactRelationship}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={50}
            y={260}
            text="PHONE"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={50}
            y={277}
            text={emergencyContactPhone}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={50}
            y={295}
            text="ADDRESS"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={50}
            y={312}
            text={emergencyContactAddress}
            fontSize={10}
            fill="#1f2937"
            wrap="word"
            width={550}
          />

          {/* Security Notice Box Above QR Code */}
          <Rect
            x={645}
            y={80}
            width={180}
            height={85}
            fill="#fee2e2"
            stroke="#dc2626"
            strokeWidth={2}
            cornerRadius={4}
          />
          <Text
            x={655}
            y={90}
            text="SECURITY NOTICE"
            fontSize={10}
            fontStyle="bold"
            fill="#dc2626"
          />
          <Text
            x={655}
            y={108}
            text="This code is for authorized"
            fontSize={8}
            fill="#991b1b"
            width={160}
          />
          <Text
            x={655}
            y={120}
            text="verification only. Personal"
            fontSize={8}
            fill="#991b1b"
            width={160}
          />
          <Text
            x={655}
            y={132}
            text="data is protected."
            fontSize={8}
            fill="#991b1b"
            width={160}
          />

          {/* QR Code on the right */}
          <Rect
            x={645}
            y={180}
            width={180}
            height={180}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={2}
            cornerRadius={8}
          />
          {qrImage && (
            <KonvaImage
              x={645}
              y={180}
              width={180}
              height={180}
              image={qrImage}
            />
          )}

          {/* Issued and Expiry Date Boxes */}
          <Rect
            x={30}
            y={360}
            width={280}
            height={80}
            stroke="#2563eb"
            strokeWidth={2}
            cornerRadius={8}
          />

          <Text
            x={40}
            y={370}
            text="ISSUED DATE"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={40}
            y={387}
            text={issuedDate}
            fontSize={11}
            fill="#1f2937"
          />

          <Text
            x={40}
            y={410}
            text="EXPIRY DATE"
            fontSize={9}
            fill="#6b7280"
            fontStyle="bold"
          />
          <Text
            x={40}
            y={427}
            text={expiryDate}
            fontSize={11}
            fill="#1f2937"
          />

          {/* Footer Bar */}
          <Rect x={0} y={490} width={856} height={50} fill="#374151" />

          <Text
            x={30}
            y={500}
            text="AUTHORIZED BY BARANGAY MAWAQUE"
            fontSize={10}
            fill="#ffffff"
            fontStyle="bold"
          />
          <Text
            x={30}
            y={518}
            text="This card must be presented upon request by authorized personnel."
            fontSize={8}
            fill="#9ca3af"
          />

          <Text
            x={650}
            y={507}
            text="VALID FOR ONE YEAR"
            fontSize={9}
            fill="#10b981"
            fontStyle="bold"
          />
        </Layer>
      </Stage>
    )
  }
)

QRTIDBackKonva.displayName = "QRTIDBackKonva"

export { QRTIDBackKonva }

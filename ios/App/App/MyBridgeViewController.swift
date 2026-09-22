//
//  MyBridgeViewController.swift
//  App
//
//  Created by Philippe Dumont on 2026-09-21.
//

import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthKitPlugin())
        bridge?.registerPluginInstance(AppleAuthPlugin())
    }
}

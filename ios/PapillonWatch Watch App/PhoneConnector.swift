//
//  PhoneConnector.swift
//  PapillonWatch Watch App
//
//  Created by Tom Theret on 20/10/2023.
//

import WatchKit
import WatchConnectivity

final class PhoneConnector: NSObject,ObservableObject {
  @Published var receivedEvents: [Event] = []
  @Published var receivedHomeworkJson: [HomeworkJson] = []
  @Published var getEdtF = ""
    var session: WCSession
        init(session: WCSession  = .default) {
      self.session = session
      super.init()
      if WCSession.isSupported() {
          session.delegate = self
          session.activate()
        print("WCSession is supported and activated.")
        } else {
            print("WCSession is not supported on this device.")
        }
    }
      // Method to update events
      func updateEvents(with events: [Event]) {
          DispatchQueue.main.async {
              self.receivedEvents = events
          }
      }
  // Method to update HomeworkJsons
  func updateHomeworkJson(with HomeworkJson: [HomeworkJson]) {
      DispatchQueue.main.async {
          self.receivedHomeworkJson = HomeworkJson
      }
  }
}

extension PhoneConnector: WCSessionDelegate {
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    print("WCSession activation completed with state: \(activationState.rawValue)")
    if let error = error {
      print("WCSession activation failed with error: \(error.localizedDescription)")
    }
    print("----------------------------------")
  }
  
  // Added
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    if let getHomeworks = message["getHomework"] as? String {
      if let data = getHomeworks.data(using: .utf8) {
        do {
          let HomeworkJson = try JSONDecoder().decode([HomeworkJson].self, from: data)
          updateHomeworkJson(with: HomeworkJson)
          print("HomeworkJson is received from iPhone: \(HomeworkJson)")
        } catch {
            print("Error parsing events from HomeworkJson: \(error)")
        }
        print("----------------------------------")
      }
    }
    
    if let getEdtF = message["getEdtF"] as? String {
      if let data = getEdtF.data(using: .utf8) {
        do {
          let events = try JSONDecoder().decode([Event].self, from: data)
          updateEvents(with: events)
          print("coursSharedTable is received from iPhone: \(events)")
        } catch {
            print("Error parsing events from coursSharedTable JSON: \(error)")
        }
        print("----------------------------------")
      }
    }
    
    
  }
}
